export interface Transaction {
    id: string;
    accountId: string;
    toAddress: string;
    fromAddress: string;
    type: string;
    amount: string;
    symbol: string;
    decimal: string;
    timestamp: string;
    txnHash: string;
}
