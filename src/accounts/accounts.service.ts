import { Injectable } from '@nestjs/common'
import { EtherscanService } from 'src/etherscan/etherscan.service'
import { Transaction } from './interfaces/transaction.interface'
import * as accountWalletMap from '../data/accountWalletMap.json'
import { randomUUID } from 'crypto'

const fs = require('fs');
const path = require('path');

@Injectable()
export class AccountsService {
    private accountWalletMap: any
    
    constructor(private etherScanService: EtherscanService) {
        this.accountWalletMap = accountWalletMap
    }

    private getMinutesDifference(dateA: Date, dateB: Date) {
        const timeAms = dateA.getTime()
        const timeBms = dateB.getTime()
        const differenceMs = Math.abs(timeAms - timeBms)
        const differenceMinutes = differenceMs / (1000 * 60)
        return differenceMinutes;
    }


    private async transactionsCached(accountId: string) {
        const filePath = path.join(__dirname, '..', 'data', `${accountId}_transactions.json`)
        try {
            await fs.promises.access(filePath, fs.constants.F_OK)
            return true
        }
        catch(error) {
            console.log(error)
            return false
        }
    }

    async findTransactions(accountId: string): Promise<any> {
        const accountFilePath = path.join(__dirname, '..', 'data', 'accountWalletMap.json')
        const transactionsFilePath = path.join(__dirname, '..', 'data', `${accountId}_transactions.json`)
        const lastCheckedDate: Date = new Date(this.accountWalletMap[accountId].lastCheckedDate)

        try {
            const exists = await this.transactionsCached(accountId)
            const currentDate = new Date()

            if (exists && lastCheckedDate && this.getMinutesDifference(currentDate, lastCheckedDate) < 1) {
                console.log('Transactions exist')

                const data = await fs.readFileSync(transactionsFilePath, 'utf8')
                const jsonData = JSON.parse(data)
                
                const apiResponse = {
                    data: jsonData,
                    count: jsonData.length
                }
                
                return apiResponse
            } else {
                console.log('Cache expired')
                const walletId = this.accountWalletMap[accountId].wallet
                const etherScanTransactions: any[] = await this.etherScanService.findAllTransactions(walletId)
                const transactions: Transaction[] = 
                    await this.transformTransactions(etherScanTransactions, accountId, walletId)

                this.accountWalletMap[accountId].lastCheckedDate = (new Date).toString()

                fs.writeFileSync(accountFilePath, JSON.stringify(this.accountWalletMap), 'utf8', (error: string) => {
                    if (error) {
                        console.error('Error creating or replacing the JSON file:', error)
                    } else {
                        console.log(`Successfully created or replaced: ${accountFilePath}`)
                    }
                })

                fs.writeFileSync(transactionsFilePath, JSON.stringify(transactions), 'utf8', (error: string) => {
                    if (error) {
                        console.error('Error creating or replacing the JSON file:', error)
                    } else {
                        console.log(`Successfully created or replaced: ${transactionsFilePath}`)
                    }
                })

                const apiResponse = {
                    data: transactions,
                    count: transactions.length
                }

                return apiResponse
            }
        }
        catch(error) {
            console.log(error)
        }
    }

    private async transformTransactions(transactions: any[], accountId: string, walletId: string): Promise<Transaction[]> {
        try {
            const transformationPromises: Promise<Transaction>[] = transactions.map(async (t: any) => {
                return this.transform(t, accountId, walletId)
            })
            const transformedTransactions: Transaction[] = await Promise.all(transformationPromises)
            return transformedTransactions.sort((a, b) => {
                const dateA = new Date(a.timestamp)
                const dateB = new Date(b.timestamp)
                return dateB.getTime() - dateA.getTime()
            })
        }
        catch(e) {
            console.log(e)
        }
        return []
    }

    private async transform(transaction: any, accountId: string, walletId: string): Promise<Transaction> {
        const date = new Date(Number(transaction.timeStamp) * 1000)
        let transformedT: Transaction = {
            id: randomUUID(),
            accountId: accountId,
            toAddress: transaction.to,
            fromAddress: transaction.from,
            type: transaction.from === walletId ? 'withdrawal' : 'deposit',
            amount: transaction.value ? 
                String(this.etherScanService.convertBigInt(
                    transaction.value, Number(transaction.tokenDecimal
                ))) : '0',
            symbol: transaction.tokenSymbol ? transaction.tokenSymbol : 'ETH',
            decimal: transaction.tokenDecimal ? transaction.tokenDecimal : '18',
            timestamp: date.toISOString(),
            txnHash: transaction.hash
        }
        return transformedT
    }
}
