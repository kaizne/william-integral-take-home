import { EtherscanService } from 'src/etherscan/etherscan.service';
export declare class StethController {
    private etherScanService;
    constructor(etherScanService: EtherscanService);
    findTotal(): Promise<any>;
    findDeposits(): Promise<any>;
}
