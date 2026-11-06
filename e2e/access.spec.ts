import { expect, test } from "@playwright/test";
import { signInAs } from "./support";

test("public page lists tools without owner details", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Borrow what you need/ })).toBeVisible();
  const pegboard = page.getByRole("region", { name: "Tools available right now" });
  await expect(pegboard.getByRole("listitem").first()).toBeVisible();
  await expect(pegboard).not.toContainText(/Lender|Mensah|Owusu|Boateng/);
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/incoming");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("regular users cannot open the admin console", async ({ page }) => {
  await signInAs(page, "borrower", "/admin");
  await expect(page.getByText("Admins only")).toBeVisible();
  await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
});

test("admins can moderate", async ({ page }) => {
  await signInAs(page, "admin", "/admin");
  for (const tab of ["All loans", "Neighbors", "Automation"]) {
    await page.getByRole("tab", { name: tab }).click();
    await expect(page.getByRole("tab", { name: tab })).toHaveAttribute("aria-selected", "true");
  }
  await page.getByRole("tab", { name: "Neighbors" }).click();
  await expect(page.getByText("Lena Lender")).toBeVisible();
});
