import { Test, TestingModule } from '@nestjs/testing';
import { StethController } from './steth.controller';

describe('StethController', () => {
  let controller: StethController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StethController],
    }).compile();

    controller = module.get<StethController>(StethController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
