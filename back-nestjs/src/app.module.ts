import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AudienceModule } from './Audience/audience.module'
import { audienceTypeModule } from './audienceType/audienceType.module'
import { AuthModule } from './auth/auth.module'
import { BuildingModule } from './building/building.module'
import { DepartmentModule } from './department/department.module'
import { DisciplineModule } from './discipline/discipline.module'
import { EquipmentModule } from './equipment/equipment.module'
import { GroupModule } from './group/group.module'
import { ParserModule } from './parser/parser.module'
import { PositionModule } from './position/position.module'
import { ScheduleModule } from './schedule/schedule.module'
import { UploadModule } from './upload/upload.module'
import { UserModule } from './user/user.module'
import { WishesModule } from './wish/wish.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		AuthModule,
		UserModule,
		EquipmentModule,
		AudienceModule,
		DepartmentModule,
		audienceTypeModule,
		BuildingModule,
		PositionModule,
		ParserModule,
		UploadModule,
		DisciplineModule,
		GroupModule,
		WishesModule,
		ScheduleModule,
	],
})
export class AppModule {}
