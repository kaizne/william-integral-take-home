import { Controller, Get, Param } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('accounts')
export class AccountsController {
    constructor(private accountsService: AccountsService) {}

    @Get(':accountId/transactions')
    @ApiOperation({
        description: 'Hardcoded accounts: VNTR5NgwPA2icJNgt2-n1, VNTR5NgwPA2icJNgt2-n2, VNTR5NgwPA2icJNgt2-n3, VNTR5NgwPA2icJNgt2-n4, VNTR5NgwPA2icJNgt2-n5'
    })
    findAccount(@Param('accountId') accountId: string): Promise<any> {
        return this.accountsService.findTransactions(accountId)
    }
}
