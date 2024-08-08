const fs = require("fs");
const path = require("path");
const recursive = require("recursive-readdir");
const matter = require("gray-matter");
const ghpages = require("gh-pages");
const { execa } = require("execa");

// Print command's output
console.log(stdout);
// 定义要读取的文件夹路径和输出 JSON 文件路径
const folderPath = path.join(__dirname, "../");
const outputFilePath = path.join(__dirname, "./database.json");

console.log(`文件夹地址 ${folderPath}\n`);
console.log(`json 文件地址 ${outputFilePath}\n`);
console.log(__dirname);
// 读取已存在的分类 JSON 文件
let existingCategories = {};
if (fs.existsSync(outputFilePath)) {
  const rawData = fs.readFileSync(outputFilePath, "utf8");
  existingCategories = JSON.parse(rawData || "{}");
}

// 读取文件夹下所有的 Markdown 文件
recursive(folderPath, ["!*.md"], async (err, files) => {
  if (err) {
    console.error("读取文件夹出错", err);
    return;
  }
  // 过滤出 Markdown 文件
  const mdFiles = files.filter((file) => path.extname(file) === ".md");
  // 遍历每个 Markdown 文件
  mdFiles.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");
    const parsed = matter(content);
    if (parsed.data.category) {
      parsed.data.category.forEach((cat) => {
        if (!existingCategories[cat]) {
          existingCategories[cat] = {
            count: 0,
            articles: [],
          };
        }
        // 检查文章是否已存在
        const articleExists = existingCategories[cat].articles.some(
          (article) => article.title === parsed.data.title
        );
        if (!articleExists) {
          existingCategories[cat].count += 1;
          existingCategories[cat].articles.push(parsed.data);
        }
      });
    }
  });
  // 将更新后的结果写入 JSON 文件
  fs.writeFileSync(
    outputFilePath,
    JSON.stringify(existingCategories, null, 2),
    "utf8"
  );
  console.log(`分类信息已保存到 ${outputFilePath}`);
  await execa`git config --global user.name 'github-actions[bot]'`;
  await execa`git config --global user.email 'github-actions[bot]@users.noreply.github.com'`;
  ghpages.publish(__dirname, function (err) {
    console.log(err);
  });
});
