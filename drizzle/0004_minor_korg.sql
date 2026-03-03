CREATE TABLE `extractionHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceUrl` text NOT NULL,
	`productId` int,
	`status` enum('pending','success','error') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `extractionHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `extractionHistory` ADD CONSTRAINT `extractionHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `extractionHistory` ADD CONSTRAINT `extractionHistory_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE set null ON UPDATE no action;