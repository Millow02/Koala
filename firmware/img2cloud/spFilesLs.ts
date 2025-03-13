import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
	Bun.env.SUPABASE_URL,
	Bun.env.SUPABASE_SERVICE_KEY,
);

async function listBucketFiles(bucketName: string): Promise<string[]> {
	try {
		const { data, error } = await supabase.storage
			.from(bucketName)
			.list("public");

		if (error) throw error;

		return data.map((file) => file.name);
	} catch (error) {
		console.error("Error listing bucket files:", error);
		return [];
	}
}

// Usage
async function main() {
	const files = await listBucketFiles("pictures");
	console.log("Files in bucket:", files);
}

main().catch(console.error);
