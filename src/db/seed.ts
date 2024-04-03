import { db } from "./db";
import * as schema from "./schema";

await db.insert(schema.todo).values([
	{
		title: "First todo",
	},
]);

console.log("Seeding complete.");
