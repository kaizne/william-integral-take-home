"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const etherscan_service_1 = require("../etherscan/etherscan.service");
const accountWalletMap = require("../data/accountWalletMap.json");
const crypto_1 = require("crypto");
const fs = require('fs');
const path = require('path');
let AccountsService = class AccountsService {
    etherScanService;
    accountWalletMap;
    constructor(etherScanService) {
        this.etherScanService = etherScanService;
        this.accountWalletMap = accountWalletMap;
    }
    getMinutesDifference(dateA, dateB) {
        const timeAms = dateA.getTime();
        const timeBms = dateB.getTime();
        const differenceMs = Math.abs(timeAms - timeBms);
        const differenceMinutes = differenceMs / (1000 * 60);
        return differenceMinutes;
    }
    async transactionsCached(accountId) {
        const filePath = path.join(__dirname, '..', 'data', `${accountId}_transactions.json`);
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            return true;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }
    async findTransactions(accountId) {
        const accountFilePath = path.join(__dirname, '..', 'data', 'accountWalletMap.json');
        const transactionsFilePath = path.join(__dirname, '..', 'data', `${accountId}_transactions.json`);
        const lastCheckedDate = new Date(this.accountWalletMap[accountId].lastCheckedDate);
        try {
            const exists = await this.transactionsCached(accountId);
            const currentDate = new Date();
            if (exists && lastCheckedDate && this.getMinutesDifference(currentDate, lastCheckedDate) < 1) {
                console.log('Transactions exist');
                const data = await fs.readFileSync(transactionsFilePath, 'utf8');
                const jsonData = JSON.parse(data);
                const apiResponse = {
                    data: jsonData,
                    count: jsonData.length
                };
                return apiResponse;
            }
            else {
                console.log('Cache expired');
                const walletId = this.accountWalletMap[accountId].walletId;
                const etherScanTransactions = await this.etherScanService.findAllTransactions(walletId);
                const transactions = await this.transformTransactions(etherScanTransactions, accountId, walletId);
                this.accountWalletMap[accountId].lastCheckedDate = (new Date).toString();
                fs.writeFileSync(accountFilePath, JSON.stringify(this.accountWalletMap), 'utf8', (error) => {
                    if (error) {
                        console.error('Error creating or replacing the JSON file:', error);
                    }
                    else {
                        console.log(`Successfully created or replaced: ${accountFilePath}`);
                    }
                });
                fs.writeFileSync(transactionsFilePath, JSON.stringify(transactions), 'utf8', (error) => {
                    if (error) {
                        console.error('Error creating or replacing the JSON file:', error);
                    }
                    else {
                        console.log(`Successfully created or replaced: ${transactionsFilePath}`);
                    }
                });
                const apiResponse = {
                    data: transactions,
                    count: transactions.length
                };
                return apiResponse;
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    async transformTransactions(transactions, accountId, walletId) {
        try {
            const transformationPromises = transactions.map(async (t) => {
                return this.transform(t, accountId, walletId);
            });
            const transformedTransactions = await Promise.all(transformationPromises);
            return transformedTransactions.sort((a, b) => {
                const dateA = new Date(a.timestamp);
                const dateB = new Date(b.timestamp);
                return dateB.getTime() - dateA.getTime();
            });
        }
        catch (e) {
            console.log(e);
        }
        return [];
    }
    async transform(transaction, accountId, walletId) {
        const date = new Date(Number(transaction.timeStamp) * 1000);
        let transformedT = {
            id: (0, crypto_1.randomUUID)(),
            accountId: accountId,
            toAddress: transaction.to,
            fromAddress: transaction.from,
            type: transaction.from === walletId ? 'withdrawal' : 'deposit',
            amount: transaction.value ?
                String(this.etherScanService.convertBigInt(transaction.value, Number(transaction.tokenDecimal))) : '0',
            symbol: transaction.tokenSymbol ? transaction.tokenSymbol : 'ETH',
            decimal: transaction.tokenDecimal ? transaction.tokenDecimal : '18',
            timestamp: date.toISOString(),
            txnHash: transaction.hash
        };
        return transformedT;
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [etherscan_service_1.EtherscanService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map