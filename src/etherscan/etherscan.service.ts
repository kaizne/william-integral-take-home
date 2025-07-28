import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { URLSearchParams } from 'url'

@Injectable()
export class EtherscanService {
    private apiKey: string = ''
    private readonly stEthContractAddress = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84'
    private readonly stEthTotalSupplyCode = '0x37cfdaca'
    private readonly stEthTotalSharesCode = '0xd5002f2e'

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('ETHERSCAN_API_KEY') || ''
        if (this.apiKey === '') {
            throw new Error('ETHERSCAN_API_KEY missing.')
        }
    }

    private createURLSearchParams(
            action: string, 
            wallet: string, 
            startBlock: number, 
            page: number, 
            sort: string
        ) {
        return new URLSearchParams({
            chainid: '1',
            module: 'account',
            action: action,
            address: wallet,
            startblock: startBlock.toString(),
            endblock: '99999999',
            page: page.toString(),
            offset: '2000',
            sort: sort,
            apikey: this.apiKey
        })
    }

    private createURLSearchParamsSTEth(signature: string) {
        return new URLSearchParams({
            chainid: '1',
            module: 'proxy',
            action: 'eth_call',
            to: this.stEthContractAddress,
            data: signature,
            tag: 'latest',
            apiKey: this.apiKey
        })
    }

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async findTransactions(type: string, walletAddress: string): Promise<any> {
        try {
            const allData: any[] = []
            let page: number = 1
            let startBlock: number = 0
            let nextPage: boolean = true

            while (nextPage) {
                let params = this.createURLSearchParams(type, walletAddress, startBlock, page, 'asc')
                let apiUrl = `https://api.etherscan.io/v2/api?${params.toString()}`
                let response = await fetch(apiUrl)
                let data = await response.json()
                if (data.status === '0') {
                    nextPage = false
                    continue
                }
                if (data.result) {
                    allData.push(...data.result)
                    console.log(`Fetched ${data.result.length} transactions for page ${page}. Total collected: ${allData.length}`);
                    if (data.result.length < 2000) {
                        nextPage = false
                    } else {
                        page++
                        if (page > 5) {
                            page = 1
                            startBlock = allData[allData.length - 1].blockNumber
                        }
                        await this.delay(100)
                    }
                }
            }

            return allData
        }
        catch(error) {
            console.log(error)
        }
    }

    public async findAllTransactions(walletAddress: string): Promise<any[]> {
        const types: string[] = ['txlist', 'txlistinternal', 'tokentx']
        let allTransactions: any[] = [];
        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            try {
                const apiResult = await this.findTransactions(type, walletAddress)
                const transactionsFromResult = apiResult || [];
                allTransactions = allTransactions.concat(transactionsFromResult)
            } catch (error) {
                console.log(error)
            }
        }

        return allTransactions;
    }

    private async findTotalPooledSTEth(): Promise<any> {
        const params = this.createURLSearchParamsSTEth(this.stEthTotalSupplyCode)
        const apiUrl = `https://api.etherscan.io/v2/api?${params.toString()}`
        try {
            const response = await fetch(apiUrl)
            const data: any = response.json()
            return data
        } catch (error) {
            console.log(error)
        }
    }

    private async findTotalSharesSTEth(): Promise<any> {
        const params = this.createURLSearchParamsSTEth(this.stEthTotalSharesCode)
        const apiUrl = `https://api.etherscan.io/v2/api?${params.toString()}`
        try {
            const response = await fetch(apiUrl)
            const data: any = response.json()
            return data
        } catch (error) {
            console.log(error)
        }
    }

    public convertBigInt(val: BigInt, tokenDecimal: number): number {
        const decimals = tokenDecimal
        let valStr = val.toString()
        while (valStr.length < decimals) {
            valStr = '0' + valStr
        }
        const integer = valStr.slice(0, -decimals)
        const fraction = valStr.slice(-decimals)
        return parseFloat(`${integer}.${fraction}`)
    }

    public async findTotalSTEth(): Promise<any> {
        const totalPooledSTEth: any = await this.findTotalPooledSTEth()
        const totalSharesSTEth: any = await this.findTotalSharesSTEth()
        const totalPooledSTEthVal: number = this.convertBigInt(BigInt(totalPooledSTEth['result']), 18)
        const totalSharesSTEthVal: number = this.convertBigInt(BigInt(totalSharesSTEth['result']), 18)
        
        return {
            data: {
                totalPooledETH: totalPooledSTEthVal,
                totalShare: totalSharesSTEthVal
            }   
        }
    }

    public async findLastNAddressesSTEth(n: number): Promise<any> {
        const params = this.createURLSearchParams('txlist', this.stEthContractAddress, 0, 1, 'desc')
        const apiUrl = `https://api.etherscan.io/v2/api?${params.toString()}`
        try {
            const response = await fetch(apiUrl)
            const data: any = await response.json()
            if (data && data.result) {
                const transactions: any[] = data.result
                const filteredTransactions = transactions
                    .filter(t => t.methodId === '0xa1903eab' && t.to === this.stEthContractAddress)
                    .map(t => t.from)
                    .slice(0, n)
                
                return {
                    data: filteredTransactions
                }
            }
        } catch(error) {
            console.log(error)
        }
    }
}
