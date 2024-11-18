import { z } from "zod";

export const itemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  icon: z.string(),
  folderId: z.string().nullable(),
  order: z.number().int().min(0),
});

export const folderSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  isOpen: z.boolean(),
  order: z.number().int().min(0),
});

export const updateItemsSchema = z.array(itemSchema);
export const updateFoldersSchema = z.array(folderSchema);
