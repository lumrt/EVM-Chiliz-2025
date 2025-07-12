import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Type de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP." },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "Le fichier est trop volumineux. Taille maximale : 5MB." },
        { status: 400 }
      );
    }

    // Créer le dossier uploads s'il n'existe pas
    const uploadDir = join(process.cwd(), "public", "uploads", "profiles");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `profile_${timestamp}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    // Convertir le fichier en buffer et l'écrire
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Retourner l'URL publique du fichier
    const publicUrl = `/uploads/profiles/${fileName}`;

    return NextResponse.json({
      message: "Fichier uploadé avec succès",
      url: publicUrl,
      fileName: fileName
    });

  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
