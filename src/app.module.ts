import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountsController } from './accounts/accounts.controller';
import { AccountsService } from './accounts/accounts.service';
import { EtherscanService } from './etherscan/etherscan.service';
import { StethController } from './steth/steth.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
  ],
  controllers: [AppController, AccountsController, StethController],
  providers: [AppService, AccountsService, EtherscanService],
})
export class AppModule {}
