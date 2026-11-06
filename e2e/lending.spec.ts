import { expect, test } from "@playwright/test";
import { loanCard, signInAs, toolTag } from "./support";

test.describe.configure({ mode: "serial" });

const toolName = `E2E saw ${Date.now().toString(36)}`;

test("lender lists a tool", async ({ page }) => {
  await signInAs(page, "lender", "/listings");
  await page.getByRole("button", { name: "List a tool" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(toolName);
  await page.getByRole("combobox", { name: "Condition" }).selectOption("Like new");
  await page.getByRole("textbox", { name: /Description/ }).fill("Created by the e2e suite.");
  await page.getByRole("button", { name: "List tool" }).click();

  await expect(page.getByText("Tool listed")).toBeVisible();
  await expect(toolTag(page, toolName).getByText("Available")).toBeVisible();
});

test("borrower finds it on the board and requests it", async ({ page }) => {
  await signInAs(page, "borrower");
  await page.getByRole("searchbox", { name: "Search tools" }).fill(toolName);
  await toolTag(page, toolName).getByRole("button", { name: "Borrow this" }).click();

  const dialog = page.getByRole("dialog", { name: /Borrow the/ });
  await expect(dialog.getByText("1 day")).toBeVisible();
  await dialog.getByRole("textbox", { name: /Note for the lender/ }).fill("Weekend project.");
  await dialog.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Request sent")).toBeVisible();

  await page.getByRole("link", { name: "My requests" }).click();
  await expect(loanCard(page, toolName).getByText("Pending")).toBeVisible();
});

test("lender approves the request and marks it returned", async ({ page }) => {
  await signInAs(page, "lender");
  await page.getByRole("link", { name: /waiting for your answer/ }).click();

  const card = loanCard(page, toolName);
  await card.getByRole("button", { name: "Approve" }).click();
  await expect(card.getByText("On loan", { exact: true }).first()).toBeVisible();

  await card.getByRole("button", { name: "Mark returned" }).click();
  await expect(card.getByText("Back")).toBeVisible();
  await expect(card.getByRole("list", { name: "Loan progress" })).toContainText("Returned");
});

test("borrower sees the loan history and lender deletes the listing", async ({ page }) => {
  await signInAs(page, "borrower", "/requests");
  await expect(loanCard(page, toolName).getByText("Returned").first()).toBeVisible();

  await signInAs(page, "lender", "/listings");
  await toolTag(page, toolName).getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete listing" }).click();
  await expect(toolTag(page, toolName)).toHaveCount(0);
});
