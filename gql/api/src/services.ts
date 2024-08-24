import { BaseMongoService } from "./db";
import { UserService } from "./apps/user/models";
import { mongoUri, mongoDbName, mongoClientOptions } from "./config";
import { AlertService } from "./apps/alerts/models";
import { TVService } from "./apps/tv/models";
import { PropertyService } from "./apps/property/models";
import { InvitationService } from "./apps/invitation/models";
import { RoomService } from "./apps/rooms/models";

export const services = {
  userService: new UserService(),
  alertService: new AlertService(),
  tvService: new TVService(),
  propertyService: new PropertyService(),
  invitationService: new InvitationService(),
  roomService: new RoomService(),
};

export const initServices = async () => {
  await BaseMongoService.connect({
    uri: mongoUri,
    dbName: mongoDbName,
    clientOptions: mongoClientOptions,
  });
  await BaseMongoService.fetchExistingCollections();
  await Promise.all(Object.values(services).map((service) => service.init()));
  return services;
};

export const terminateServices = async () =>
  await BaseMongoService.disconnect();
