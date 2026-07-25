/**
 * 콘텐츠를 최초 시드 데이터(content/seed.json)로 되돌립니다.
 * 사용법: npm run seed:reset
 * 주의: content/site-content.json 이 시드 데이터로 완전히 교체됩니다.
 */
import fs from "node:fs";
import path from "node:path";

const seedPath = path.join(process.cwd(), "content", "seed.json");
const targetPath = path.join(process.cwd(), "content", "site-content.json");

const seed = fs.readFileSync(seedPath, "utf-8");
fs.writeFileSync(targetPath, seed, "utf-8");

console.log("content/site-content.json 을 시드 데이터로 초기화했습니다.");
