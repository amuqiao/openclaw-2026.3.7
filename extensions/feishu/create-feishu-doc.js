import * as Lark from "@larksuiteoapi/node-sdk";

const APP_ID = "cli_a9c97317ef78dbc6";
const APP_SECRET = "bHTIdpglmPdAOu8gyFltadE4whZb3VTZ";
const OWNER_OPEN_ID = "ou_a7dec70eacd80b816b061315d352d545";

const client = new Lark.Client({
  appId: APP_ID,
  appSecret: APP_SECRET,
});

async function createDocument() {
  try {
    // Create document
    const createRes = await client.docx.document.create({
      body: {
        title: "飞书云文档介绍",
        owner: OWNER_OPEN_ID,
      },
    });

    console.log("Create response:", JSON.stringify(createRes, null, 2));

    if (createRes.code !== 0) {
      console.error("Create failed:", createRes);
      process.exit(1);
    }

    const docToken = createRes.data?.document?.document_id;

    // Construct URL from document_id (Feishu docx URL format)
    const docUrl = `https://www.feishu.cn/docx/${docToken}`;

    console.log("Document created:");
    console.log("  Token:", docToken);
    console.log("  URL:", docUrl);

    if (!docToken) {
      console.error("Failed to get document token from response");
      process.exit(1);
    }

    // Get the document metadata to find the root block
    console.log("Fetching document metadata...");
    const docMetaRes = await client.docx.document.get({
      path: { document_id: docToken },
    });

    console.log("Document metadata:", JSON.stringify(docMetaRes, null, 2));

    let rootBlockId = docMetaRes.data?.document?.root_block_id || docToken;
    console.log("Using root block:", rootBlockId);

    // Prepare markdown content
    const markdownContent = `# 飞书云文档介绍

## 什么是飞书云文档？

飞书云文档是飞书提供的一款在线协作文档工具，支持多人实时协作编辑，让团队合作更加高效。

## 主要功能

### 1. 实时协作
- 多人同时编辑同一文档
- 实时看到他人的编辑内容
- 评论和@提醒功能

### 2. 丰富的内容格式
- 支持标题、段落、列表
- 代码块、表格、引用
- 图片、文件附件
- 思维导图、流程图

### 3. 云端存储
- 自动保存，无需担心丢失
- 多端同步，随时随地访问
- 版本历史，可回溯任意版本

### 4. 权限管理
- 灵活的分享权限设置
- 支持按人、按部门授权
- 可查看、可编辑、可评论等多种权限

## 使用场景

- 团队文档：项目计划、会议纪要、需求文档
- 知识库：团队 Wiki、操作手册、FAQ
- 个人笔记：学习笔记、工作日志、想法记录

## 快速开始

1. 点击新建创建文档
2. 输入内容，格式自动识别
3. 点击右上角分享邀请协作者
4. 使用评论功能进行讨论

## 更多资源

- 飞书官方文档：https://www.feishu.cn/hc/zh-CN/articles/360049411664
- 云文档使用指南：https://www.feishu.cn/hc/zh-CN/articles/360049411883

---

本文档由 OpenClaw 自动创建
`;

    // Convert markdown to blocks for insertion
    const blocks = markdownContent
      .split("\n")
      .map((line) => {
        if (line.startsWith("# ")) {
          return {
            block_type: 3, // Heading1
            heading1: {
              elements: [{ text: { content: line.slice(2) } }],
            },
          };
        } else if (line.startsWith("## ")) {
          return {
            block_type: 4, // Heading2
            heading2: {
              elements: [{ text: { content: line.slice(3) } }],
            },
          };
        } else if (line.startsWith("### ")) {
          return {
            block_type: 5, // Heading3
            heading3: {
              elements: [{ text: { content: line.slice(4) } }],
            },
          };
        } else if (line.startsWith("- ")) {
          return {
            block_type: 12, // Bullet
            bullet: {
              elements: [{ text: { content: line.slice(2) } }],
            },
          };
        } else if (line.match(/^\d+\. /)) {
          return {
            block_type: 13, // Ordered
            ordered: {
              elements: [{ text: { content: line.replace(/^\d+\. /, "") } }],
            },
          };
        } else if (line.startsWith("---")) {
          return {
            block_type: 22, // Divider
          };
        } else if (line.trim() === "") {
          return null; // Skip empty lines
        } else {
          return {
            block_type: 2, // Text
            text: {
              elements: [{ text: { content: line } }],
            },
          };
        }
      })
      .filter(Boolean);

    // Insert blocks in batches under the root block
    const BATCH_SIZE = 50;
    for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
      const batch = blocks.slice(i, i + BATCH_SIZE);
      const insertRes = await client.docx.documentBlockChildren.create({
        path: { document_id: docToken, block_id: rootBlockId },
        data: {
          children: batch,
        },
      });

      if (insertRes.code !== 0) {
        console.error("Insert failed at batch", i, ":", insertRes);
      } else {
        console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} blocks)`);
      }
    }

    console.log("\nContent written successfully!");
    console.log("Final URL:", docUrl);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createDocument();
