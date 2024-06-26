import { RequestHandler } from "express";
import { IUpgradesRequest } from "@/src/types/requestTypes";
import { IPolarity } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { IGenericItemDatabase, IMiscItem, TGenericItemKey } from "@/src/types/inventoryTypes/inventoryTypes";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addMiscItems, getInventory, updateCurrency } from "@/src/services/inventoryService";

export const upgradesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = JSON.parse(req.body.toString()) as IUpgradesRequest;
    const inventory = await getInventory(accountId);
    const InventoryChanges: any = {};
    for (const operation of payload.Operations) {
        if (
            operation.UpgradeRequirement == "/Lotus/Types/Items/MiscItems/ModSlotUnlocker" ||
            operation.UpgradeRequirement == "/Lotus/Types/Items/MiscItems/CustomizationSlotUnlocker"
        ) {
            await updateCurrency(10, true, accountId);
        } else {
            addMiscItems(inventory, [
                {
                    ItemType: operation.UpgradeRequirement,
                    ItemCount: -1
                } satisfies IMiscItem
            ]);
        }

        switch (operation.UpgradeRequirement) {
            case "/Lotus/Types/Items/MiscItems/OrokinReactor":
            case "/Lotus/Types/Items/MiscItems/OrokinCatalyst":
                for (const item of inventory[payload.ItemCategory as TGenericItemKey] as IGenericItemDatabase[]) {
                    if (item._id.toString() == payload.ItemId.$oid) {
                        item.Features ??= 0;
                        item.Features |= 1;
                        break;
                    }
                }
                break;
            case "/Lotus/Types/Items/MiscItems/UtilityUnlocker":
            case "/Lotus/Types/Items/MiscItems/WeaponUtilityUnlocker":
                for (const item of inventory[payload.ItemCategory as TGenericItemKey] as IGenericItemDatabase[]) {
                    if (item._id.toString() == payload.ItemId.$oid) {
                        item.Features ??= 0;
                        item.Features |= 2;
                        break;
                    }
                }
                break;
            case "/Lotus/Types/Items/MiscItems/WeaponPrimaryArcaneUnlocker":
            case "/Lotus/Types/Items/MiscItems/WeaponSecondaryArcaneUnlocker":
            case "/Lotus/Types/Items/MiscItems/WeaponMeleeArcaneUnlocker":
                for (const item of inventory[payload.ItemCategory as TGenericItemKey] as IGenericItemDatabase[]) {
                    if (item._id.toString() == payload.ItemId.$oid) {
                        item.Features ??= 0;
                        item.Features |= 32;
                        break;
                    }
                }
                break;
            case "/Lotus/Types/Items/MiscItems/Forma":
            case "/Lotus/Types/Items/MiscItems/FormaAura":
            case "/Lotus/Types/Items/MiscItems/FormaStance":
                for (const item of inventory[payload.ItemCategory as TGenericItemKey] as IGenericItemDatabase[]) {
                    if (item._id.toString() == payload.ItemId.$oid) {
                        item.XP = 0;
                        item.Polarity ??= [];
                        item.Polarity.push({
                            Slot: operation.PolarizeSlot,
                            Value: operation.PolarizeValue
                        } satisfies IPolarity);
                        item.Polarized ??= 0;
                        item.Polarized += 1;
                        break;
                    }
                }
                break;
            case "/Lotus/Types/Items/MiscItems/ModSlotUnlocker":
                for (const item of inventory[payload.ItemCategory as TGenericItemKey] as IGenericItemDatabase[]) {
                    if (item._id.toString() == payload.ItemId.$oid) {
                        item.ModSlotPurchases ??= 0;
                        item.ModSlotPurchases += 1;
                        InventoryChanges[payload.ItemCategory] = {
                            ItemId: {
                                $oid: payload.ItemId.$oid
                            },
                            ModSlotPurchases: item.ModSlotPurchases
                        };
                        break;
                    }
                }
                break;
            case "/Lotus/Types/Items/MiscItems/CustomizationSlotUnlocker":
                for (const item of inventory[payload.ItemCategory as TGenericItemKey] as IGenericItemDatabase[]) {
                    if (item._id.toString() == payload.ItemId.$oid) {
                        item.CustomizationSlotPurchases ??= 0;
                        item.CustomizationSlotPurchases += 1;
                        InventoryChanges[payload.ItemCategory] = {
                            ItemId: {
                                $oid: payload.ItemId.$oid
                            },
                            CustomizationSlotPurchases: item.CustomizationSlotPurchases
                        };
                        break;
                    }
                }
                break;
            default:
                throw new Error("Unsupported upgrade: " + operation.UpgradeRequirement);
        }
    }
    await inventory.save();
    res.json({ InventoryChanges });
};
