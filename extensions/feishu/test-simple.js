import * as Lark from "@larksuiteoapi/node-sdk";

const APP_ID = "cli_a9c97317ef78dbc6";
const APP_SECRET = "bHTIdpglmPdAOu8gyFltadE4whZb3VTZ";

const client = new Lark.Client({
  appId: APP_ID,
  appSecret: APP_SECRET,
});

async function test() {
  // Create document
  const createRes = await client.docx.document.create({
    data: { title: "Test Document" },
  });

  console.log("Create response:", JSON.stringify(createRes, null, 2));

  const docToken = createRes.data?.document?.document_id;
  console.log("Document ID:", docToken);

  // Try to get document blocks using documentBlock.list
  const listRes = await client.docx.documentBlock.list({
    path: { document_id: docToken },
  });

  console.log("List blocks response:", JSON.stringify(listRes, null, 2));

  // Get the root block ID from the list (block_type 1 is Page)
  const rootBlock = listRes.data?.items?.find((b) => b.block_type === 1);
  const actualRootBlockId = rootBlock?.block_id;
  console.log("Actual root block ID from list:", actualRootBlockId);

  if (actualRootBlockId) {
    // Try to insert using the actual root block ID with params
    console.log("\nTrying to insert with actual root block ID and params...");
    const insertRes = await client.docx.documentBlockChildren.create({
      path: { document_id: docToken, block_id: actualRootBlockId },
      params: { document_revision_id: -1 },
      data: {
        children: [
          {
            block_type: 2,
            text: {
              elements: [{ text: { content: "Hello World!" } }],
            },
          },
        ],
      },
    });
    console.log("Insert response:", JSON.stringify(insertRes, null, 2));
  }
}

test().catch(console.error);
