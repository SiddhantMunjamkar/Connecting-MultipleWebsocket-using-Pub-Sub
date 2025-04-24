import { createClient } from "redis";

export const publishclient = createClient();
publishclient.connect();

export const subscribeClient = createClient();
subscribeClient.connect();
