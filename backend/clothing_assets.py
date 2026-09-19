from __future__ import annotations

from dataclasses import dataclass
from typing import Dict


# =========================================================
# Clothing Asset Definition
# =========================================================

@dataclass(frozen=True)
class ClothingAsset:
    index: int
    name: str
    filename: str
    url_path: str


# =========================================================
# 14 Clothing Assets
# =========================================================

CLOTHING_ASSETS: Dict[int, ClothingAsset] = {
    0: ClothingAsset(
        index=0,
        name="Shirt",
        filename="clothing-1.svg",
        url_path="/icons/clothing-1.svg",
    ),
    1: ClothingAsset(
        index=1,
        name="Polo",
        filename="clothing-2.svg",
        url_path="/icons/clothing-2.svg",
    ),
    2: ClothingAsset(
        index=2,
        name="Suit",
        filename="clothing-3.svg",
        url_path="/icons/clothing-3.svg",
    ),
    3: ClothingAsset(
        index=3,
        name="Blazer",
        filename="clothing-4.svg",
        url_path="/icons/clothing-4.svg",
    ),
    4: ClothingAsset(
        index=4,
        name="Saree",
        filename="clothing-5.svg",
        url_path="/icons/clothing-5.svg",
    ),
    5: ClothingAsset(
        index=5,
        name="Hijab",
        filename="clothing-6.svg",
        url_path="/icons/clothing-6.svg",
    ),
    6: ClothingAsset(
        index=6,
        name="Panjabi",
        filename="clothing-7.svg",
        url_path="/icons/clothing-7.svg",
    ),
    7: ClothingAsset(
        index=7,
        name="Dress",
        filename="clothing-8.svg",
        url_path="/icons/clothing-8.svg",
    ),
    8: ClothingAsset(
        index=8,
        name="T-Shirt",
        filename="clothing-9.svg",
        url_path="/icons/clothing-9.svg",
    ),
    9: ClothingAsset(
        index=9,
        name="Abaya",
        filename="clothing-10.svg",
        url_path="/icons/clothing-10.svg",
    ),
    10: ClothingAsset(
        index=10,
        name="Burqa",
        filename="clothing-11.svg",
        url_path="/icons/clothing-11.svg",
    ),
    11: ClothingAsset(
        index=11,
        name="Kameez",
        filename="clothing-12.svg",
        url_path="/icons/clothing-12.svg",
    ),
    12: ClothingAsset(
        index=12,
        name="Kurti",
        filename="clothing-13.svg",
        url_path="/icons/clothing-13.svg",
    ),
    13: ClothingAsset(
        index=13,
        name="Jacket",
        filename="clothing-14.svg",
        url_path="/icons/clothing-14.svg",
    ),
}


# =========================================================
# Helpers
# =========================================================

def get_clothing_asset(index: int) -> ClothingAsset:
    """
    Return one clothing asset by its frontend index.
    """

    try:
        return CLOTHING_ASSETS[int(index)]
    except (KeyError, TypeError, ValueError):
        raise ValueError(
            f"Invalid clothing index: {index}. "
            "Expected a value between 0 and 13."
        )


def get_clothing_name(index: int) -> str:
    """
    Return the human-readable clothing name.
    """

    return get_clothing_asset(index).name


def get_clothing_url_path(index: int) -> str:
    """
    Return the corresponding Next.js public URL path.
    """

    return get_clothing_asset(index).url_path


def get_all_clothing_assets() -> list[dict]:
    """
    Return all clothing assets in frontend order.
    """

    return [
        {
            "index": asset.index,
            "name": asset.name,
            "filename": asset.filename,
            "urlPath": asset.url_path,
        }
        for asset in CLOTHING_ASSETS.values()
    ]