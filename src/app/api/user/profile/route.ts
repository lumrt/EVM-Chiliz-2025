import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@root/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { message: "Adresse wallet requise" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { wallet },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, wallet, username, displayName, bio, profilePicture } = body;

    // Validation des champs requis
    if (!email || !wallet || !username || !displayName) {
      return NextResponse.json(
        { message: "Email, wallet, username et displayName sont requis" },
        { status: 400 }
      );
    }

    // Validation du format du username
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { message: "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { message: "Le nom d'utilisateur doit contenir au moins 3 caractères" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { wallet },
          { email },
          { username },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.wallet === wallet) {
        return NextResponse.json(
          { message: "Un utilisateur avec cette adresse wallet existe déjà" },
          { status: 409 }
        );
      }
      if (existingUser.email === email) {
        return NextResponse.json(
          { message: "Un utilisateur avec cet email existe déjà" },
          { status: 409 }
        );
      }
      if (existingUser.username === username) {
        return NextResponse.json(
          { message: "Ce nom d'utilisateur est déjà pris" },
          { status: 409 }
        );
      }
    }

    // Créer le nouvel utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        wallet,
        username,
        displayName,
        bio: bio || null,
        profilePicture: profilePicture || null,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du profil:", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, username, displayName, bio, profilePicture } = body;

    if (!wallet) {
      return NextResponse.json(
        { message: "Adresse wallet requise" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { wallet },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Si le username change, vérifier qu'il n'est pas déjà pris
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username },
      });

      if (usernameExists) {
        return NextResponse.json(
          { message: "Ce nom d'utilisateur est déjà pris" },
          { status: 409 }
        );
      }
    }

    // Mettre à jour l'utilisateur
    const updateData: any = {};
    if (username) updateData.username = username;
    if (displayName) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio || null;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture || null;

    const updatedUser = await prisma.user.update({
      where: { wallet },
      data: updateData,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
