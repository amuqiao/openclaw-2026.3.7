import * as Lark from "@larksuiteoapi/node-sdk";

const APP_ID = "cli_a9c97317ef78dbc6";
const APP_SECRET = "bHTIdpglmPdAOu8gyFltadE4whZb3VTZ";
const OWNER_OPEN_ID = "ou_a7dec70eacd80b816b061315d352d545";

const client = new Lark.Client({
  appId: APP_ID,
  appSecret: APP_SECRET,
});

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

async function createDocument() {
  try {
    // Step 1: Create document
    console.log("Creating document...");
    const createRes = await client.docx.document.create({
      data: { title: "飞书云文档介绍" },
    });

    if (createRes.code !== 0) {
      console.error("Create failed:", createRes);
      process.exit(1);
    }

    const docToken = createRes.data?.document?.document_id;
    const docUrl = `https://www.feishu.cn/docx/${docToken}`;

    console.log("Document created:");
    console.log("  Token:", docToken);
    console.log("  URL:", docUrl);

    // Step 2: Convert markdown to blocks
    console.log("\nConverting markdown to blocks...");
    const convertRes = await client.docx.document.convert({
      data: { content_type: "markdown", content: markdownContent },
    });

    if (convertRes.code !== 0) {
      console.error("Convert failed:", convertRes);
      process.exit(1);
    }

    const blocks = convertRes.data?.blocks ?? [];
    const firstLevelBlockIds = convertRes.data?.first_level_block_ids ?? [];

    console.log(`Converted to ${blocks.length} blocks`);
    console.log("First level block IDs:", firstLevelBlockIds);

    // Step 3: Get the page block (root)
    console.log("\nGetting page block...");
    const listRes = await client.docx.documentBlock.list({
      path: { document_id: docToken },
    });

    const pageBlock = listRes.data?.items?.find((b) => b.block_type === 1);
    const pageBlockId = pageBlock?.block_id || docToken;
    console.log("Page block ID:", pageBlockId);

    // Step 4: Insert blocks using documentBlockDescendant.create
    console.log("\nInserting blocks...");
    const insertRes = await client.docx.documentBlockDescendant.create({
      path: { document_id: docToken, block_id: pageBlockId },
      data: {
        children_id: firstLevelBlockIds,
        descendants: blocks,
        index: -1,
      },
    });

    if (insertRes.code !== 0) {
      console.error("Insert failed:", insertRes);
      process.exit(1);
    }

    console.log("Blocks inserted successfully!");
    console.log("Inserted children:", insertRes.data?.children?.length);

    // Step 5: Grant permission to owner
    console.log("\nGranting permission to owner...");
    try {
      const permRes = await client.drive.permissionMember.create({
        path: { token: docToken },
        params: { type: "docx", need_notification: false },
        data: {
          member_type: "openid",
          member_id: OWNER_OPEN_ID,
          perm: "edit",
        },
      });
      console.log("Permission granted:", permRes.code === 0 ? "success" : permRes);
    } catch (err) {
      console.log("Permission grant skipped/failed:", err.message);
    }

    console.log("\n✅ Document created successfully!");
    console.log("📄 Final URL:", docUrl);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

createDocument();
