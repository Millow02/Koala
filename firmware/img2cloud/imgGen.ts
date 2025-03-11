import fs from "fs/promises";
import path from "path";
import { createCanvas } from "canvas";

interface ImageConfig {
	width: number;
	height: number;
	outputDir: string;
}

async function generateRandomImages(
	count: number,
	config: ImageConfig,
): Promise<void> {
	const { width, height, outputDir } = config;

	// Create output directory if it doesn't exist
	await fs.mkdir(outputDir, { recursive: true });

	for (let i = 0; i < count; i++) {
		const canvas = createCanvas(width, height);
		const ctx = canvas.getContext("2d");

		// Generate random colors and shapes
		ctx.fillStyle = `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`;
		ctx.fillRect(0, 0, width, height);

		// Add some random circles
		for (let j = 0; j < 5; j++) {
			ctx.beginPath();
			ctx.fillStyle = `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`;
			ctx.arc(
				Math.random() * width,
				Math.random() * height,
				Math.random() * 50,
				0,
				Math.PI * 2,
			);
			ctx.fill();
		}

		// Save the image
		const buffer = canvas.toBuffer("image/jpeg");
		const filename = path.join(outputDir, `random_${i + 1}.jpg`);
		await fs.writeFile(filename, buffer);
	}
}

// Usage
const config: ImageConfig = {
	width: 800,
	height: 600,
	outputDir: "../pics",
};

generateRandomImages(10, config).catch(console.error);
