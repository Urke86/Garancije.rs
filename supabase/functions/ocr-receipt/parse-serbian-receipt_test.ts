import { parseSerbianReceipt } from "../parse-serbian-receipt.ts";

const fixtures = [
  { file: "supermarket.txt", store: "MAXI DOO BEOGRAD", pib: "123456789", total: "537.00" },
  { file: "electronics.txt", store: "GIGATRON d.o.o.", pib: "107415123", total: "13480.00" },
];

for (const fixture of fixtures) {
  const raw = await Deno.readTextFile(new URL(`./__fixtures__/${fixture.file}`, import.meta.url));
  const result = parseSerbianReceipt(raw);

  Deno.test(`parse ${fixture.file}`, () => {
    if (!result.store_name.includes(fixture.store.split(" ")[0])) {
      throw new Error(`store_name: expected ${fixture.store}, got ${result.store_name}`);
    }
    if (result.pib !== fixture.pib) {
      throw new Error(`pib: expected ${fixture.pib}, got ${result.pib}`);
    }
    if (result.total_amount !== fixture.total) {
      throw new Error(`total: expected ${fixture.total}, got ${result.total_amount}`);
    }
    if (result.items.length < 1) {
      throw new Error("expected at least one item");
    }
  });
}
