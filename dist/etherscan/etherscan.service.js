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
exports.EtherscanService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const url_1 = require("url");
let EtherscanService = class EtherscanService {
    configService;
    apiKey = '';
    stEthContractAddress = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84';
    stEthTotalSupplyCode = '0x37cfdaca';
    stEthTotalSharesCode = '0xd5002f2e';
    constructor(configService) {
        this.configService = configService;
        this.apiKey = this.configService.get('ETHERSCAN_API_KEY') || '';
        if (this.apiKey === '') {
            throw new Error('ETHERSCAN_API_KEY missing.');
        }
    }
    createURLSearchParams(action, wallet, startBlock, page, sort) {
        return new url_1.URLSearchParams({
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
        });
    }
    createURLSearchParamsSTEth(signature) {
        return new url_1.URLSearchParams({
            chainid: '1',
            module: 'proxy',
            action: 'eth_call',
            to: this.stEthContractAddress,
            data: signature,
            tag: 'latest',
            apiKey: this.apiKey
        });
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async findTransactions(type, walletAddress) {
        try {
            const allData = [];
            let page = 1;
            let startBlock = 0;
            let nextPage = true;
            while (nextPage) {
                let params = this.createURLSearchParams(type, walletAddress, startBlock, page, 'asc');
                let apiUrl = `https://api.etherscan.io/v2/api?${params.toString()}`;
                let response = await fetch(apiUrl);
                let data = await response.json();
                if (data.status === '0') {
                    nextPage = false;
                    continue;
                }
                if (data.result) {
                    allData.push(...data.result);
                    console.log(`Fetched ${data.result.length} transactions for page ${page}. Total collected: ${allData.length}`);
                    if (data.result.length < 2000) {
                        nextPage = false;
                    }
                    else {
                        page++;
                        if (page > 5) {
                            page = 1;
                            startBlock = allData[allData.length - 1].blockNumber;
                        }
                        await this.delay(100);
                    }
                }
            }
            return allData;
        }
        catch (error) {
            console.log(error);
        }
    }
    async findAllTransactions(walletAddress) {
        const types = ['txlist', 'txlistinternal', 'tokentx'];
        let allTransactions = [];
        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            try {
                const apiResult = await this.findTransactions(type, walletAddress);
                const transactionsFromResult = apiResult || [];
                allTransactions = allTransactions.concat(transactionsFromResult);
            }
            catch (error) {
                console.log(error);
            }
        }
        return allTransactions;
    }
    async findTotalPooledSTEth() {
        const params = this.createURLSearchParamsSTEth(this.stEthTotalSupplyCode);
        const apiUrl = `https://api.etherscan.io/v2/api?${params.toString()}`;
        try {
            const response = await fetch(apiUrl);
            const data = response.json();
            return data;
        }
        catch (error) {
            console.log(error);
        }
    }
    async findTotalSharesSTEth() {
        const params = this.createURLSearchParamsSTEth(this.stEthTotalSharesCode);
        const apiUrl = `https://api.etherscan.io/v2/api?${params.toString()}`;
        try {
            const response = await fetch(apiUrl);
            const data = response.json();
            return data;
        }
        catch (error) {
            console.log(error);
        }
    }
    convertBigInt(val, tokenDecimal) {
        const decimals = tokenDecimal;
        let valStr = val.toString();
        while (valStr.length < decimals) {
            valStr = '0' + valStr;
        }
        const integer = valStr.slice(0, -decimals);
        const fraction = valStr.slice(-decimals);
        return parseFloat(`${integer}.${fraction}`);
    }
    async findTotalSTEth() {
        const totalPooledSTEth = await this.findTotalPooledSTEth();
        const totalSharesSTEth = await this.findTotalSharesSTEth();
        const totalPooledSTEthVal = this.convertBigInt(BigInt(totalPooledSTEth['result']), 18);
        const totalSharesSTEthVal = this.convertBigInt(BigInt(totalSharesSTEth['result']), 18);
        return {
            data: {
                totalPooledETH: totalPooledSTEthVal,
                totalShare: totalSharesSTEthVal
            }
        };
    }
    async findLastNAddressesSTEth(n) {
        const params = this.createURLSearchParams('txlist', this.stEthContractAddress, 0, 1, 'desc');
        const apiUrl = `https://api.etherscan.io/v2/api?${params.toString()}`;
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data && data.result) {
                const transactions = data.result;
                const filteredTransactions = transactions
                    .filter(t => t.methodId === '0xa1903eab' && t.to === this.stEthContractAddress)
                    .map(t => t.from)
                    .slice(0, n);
                return {
                    data: filteredTransactions
                };
            }
        }
        catch (error) {
            console.log(error);
        }
    }
};
exports.EtherscanService = EtherscanService;
exports.EtherscanService = EtherscanService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EtherscanService);
//# sourceMappingURL=etherscan.service.js.map