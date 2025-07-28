import { Controller, Get, Param } from '@nestjs/common';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
    constructor(private accountsService: AccountsService) {}

    @Get(':accountId/transactions')
    findAccount(@Param('accountId') accountId: string): Promise<any> {
        return this.accountsService.findTransactions(accountId)
    }
}
