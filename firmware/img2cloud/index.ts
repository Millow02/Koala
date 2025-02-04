/* Img2Cloud */

import { readdir } from "fs/promises";
import { createClient } from "@supabase/supabase-js";

const IMG2CLOUD_LOG_PREFIX = "IMG2CLOUD";

const supabase = createClient(
	Bun.env.SUPABASE_URL,
	Bun.env.SUPABASE_SERVICE_KEY,
);

try {
	const { data, error } = await supabase.storage.createBucket("pictures", {
		public: false,
		allowedMimeTypes: ["image/*"],
		fileSizeLimit: "1MB",
	});
} catch (error) {
	console.log(`${IMG2CLOUD_LOG_PREFIX} - Bucket has already been created`);
}

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

async function watchFolder(folderPath: string) {
	try {
		while (true) {
			// query all the pictures in the folder
			const allFiles = await readdir(folderPath);
			const imageFiles = new Set(
				allFiles.filter((file) =>
					IMAGE_EXTENSIONS.has(file.toLowerCase().slice(file.lastIndexOf("."))),
				),
			);

			console.log("Current images:", imageFiles);

			// upload the pictures
			// const { data, error } = await supabase.storage
			// 	.from("pictures")
			// 	.upload("file_path", file);
			// if (error) {
			// 	console.log(`${IMG2CLOUD_LOG_PREFIX} - ${error}`);
			// } else {
			// 	// Handle success
			// }

			// delete the images

			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	} catch (error) {
		console.error(
			"Error watching folder:",
			error instanceof Error ? error.message : error,
		);
	}
}

// Clean up on Ctrl + C interrupt
process.on("SIGINT", () => {
	console.log("\nStopping folder watch");
	process.exit(0);
});

// Start watching the folder
watchFolder("../pics").catch(console.error);
