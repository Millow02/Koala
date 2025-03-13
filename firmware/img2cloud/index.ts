/* Img2Cloud */

import { readdir, readFile } from "fs/promises";
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
	console.log(`${IMG2CLOUD_LOG_PREFIX} - ${error}`);
}

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);

async function watchFolder(folderPath: string) {
	try {
		const imageFiles = new Set<string>();

		while (true) {
			// query all the pictures in the folder
			const allFiles = await readdir(folderPath);

			allFiles
				.filter((fileName) =>
					IMAGE_EXTENSIONS.has(
						fileName.toLowerCase().slice(fileName.lastIndexOf(".")),
					),
				)
				.forEach((fileName) => {
					imageFiles.add(fileName);
				});

			console.log(
				`${IMG2CLOUD_LOG_PREFIX} - Current image files found in pics/: ${Array.from(imageFiles)}`,
			);

			imageFiles.forEach(async (image) => {
				// upload the pictures
				//
				const file = await readFile(`${folderPath}/${image}`);

				const { data, error } = await supabase.storage
					.from("pictures")
					.upload(`public/${image}`, file, { contentType: "image/*" });

				if (error) {
					console.log(
						`${IMG2CLOUD_LOG_PREFIX} - Error uploading images ${error.name} - ${error.cause} - ${error.message}`,
					);
				} else {
					// Handle success
					//
					console.log(
						`${IMG2CLOUD_LOG_PREFIX} - Upload success: ${data.fullPath} - ${data.id}`,
					);
					// We will delete the image files here
					//
					// Remove from disk and from Set
					await Bun.file(`${folderPath}/${image}`).delete();
					imageFiles.delete(image);
				}
			});

			// make sure CPU doesnt spin lock
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
