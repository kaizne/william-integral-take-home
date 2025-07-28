import { Controller, Get, Param } from '@nestjs/common';
import { EtherscanService } from 'src/etherscan/etherscan.service'

@Controller('steth')
export class StethController {

    constructor(private etherScanService: EtherscanService) {}

    @Get('total')
    findTotal(): Promise<any> {
        return this.etherScanService.findTotalSTEth()
    }

    @Get('deposits')
    findDeposits(): Promise<any> {
        return this.etherScanService.findLastNAddressesSTEth(5)
    }
}
