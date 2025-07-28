import { AccountsService } from './accounts.service';
export declare class AccountsController {
    private accountsService;
    constructor(accountsService: AccountsService);
    findAccount(accountId: string): Promise<any>;
}
