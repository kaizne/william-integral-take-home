import { EtherscanService } from 'src/etherscan/etherscan.service';
export declare class AccountsService {
    private etherScanService;
    private accountWalletMap;
    constructor(etherScanService: EtherscanService);
    private getMinutesDifference;
    private transactionsCached;
    findTransactions(accountId: string): Promise<any>;
    private transformTransactions;
    private transform;
}
