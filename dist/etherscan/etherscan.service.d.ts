import { ConfigService } from '@nestjs/config';
export declare class EtherscanService {
    private configService;
    private apiKey;
    private readonly stEthContractAddress;
    private readonly stEthTotalSupplyCode;
    private readonly stEthTotalSharesCode;
    constructor(configService: ConfigService);
    private createURLSearchParams;
    private createURLSearchParamsSTEth;
    private delay;
    private findTransactions;
    findAllTransactions(walletAddress: string): Promise<any[]>;
    private findTotalPooledSTEth;
    private findTotalSharesSTEth;
    convertBigInt(val: BigInt, tokenDecimal: number): number;
    findTotalSTEth(): Promise<any>;
    findLastNAddressesSTEth(n: number): Promise<any>;
}
