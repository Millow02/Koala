import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
	Bun.env.SUPABASE_URL,
	Bun.env.SUPABASE_SERVICE_KEY,
);

async function deleteFolderContents(
	bucketName: string,
	folderPath: string,
): Promise<boolean> {
	try {
		const { data: files, error: listError } = await supabase.storage
			.from(bucketName)
			.list(folderPath);

		if (listError) throw listError;

		const filePaths = files.map((file) => `${folderPath}/${file.name}`);

		if (filePaths.length > 0) {
			const { error: deleteError } = await supabase.storage
				.from(bucketName)
				.remove(filePaths);

			if (deleteError) throw deleteError;
		}

		return true;
	} catch (error) {
		console.error("Error deleting folder contents:", error);
		return false;
	}
}

// Usage
async function main() {
	const success = await deleteFolderContents("pictures", "public");
	console.log(
		success ? "Folder emptied successfully" : "Failed to empty folder",
	);
}

main().catch(console.error);
