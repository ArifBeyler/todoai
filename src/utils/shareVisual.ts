import * as Sharing from "expo-sharing";

export const shareVisual = async (
  imageUrl: string,
  todoTitle?: string,
): Promise<boolean> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) return false;

    await Sharing.shareAsync(imageUrl, {
      mimeType: "image/jpeg",
      dialogTitle: todoTitle
        ? `Doara — ${todoTitle}`
        : "Doara — Kişisel Görselin",
    });

    return true;
  } catch {
    return false;
  }
};
