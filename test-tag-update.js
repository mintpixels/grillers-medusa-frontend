const { GraphQLClient, gql } = require('graphql-request');

const strapiClient = new GraphQLClient(
  'https://helpful-nature-fab70f9c51.strapiapp.com/graphql',
  {
    headers: {
      Authorization: 'Bearer 15ef74a4f45aca7ba42c25a4ca4d4a7f506c0fc396cf6b6c9760d61233e167a8322312cfdd971aa881e658fd41380973325ae053f3f3a436018cfab73970a77c9846636d98e6e7168aa1792d9975f4e304185a8ae5674f2ccdab2ccd8478e094753c2425a2e2e0e36eac25c1e30fb10af29fa6c194b1fa83576711c12a67065d',
    },
  }
);

async function testTagUpdate() {
  // Get one product
  const getProductQuery = gql`
    query GetOneProduct {
      products(pagination: { limit: 1 }) {
        documentId
        Title
      }
    }
  `;
  
  const productResult = await strapiClient.request(getProductQuery);
  const product = productResult.products[0];
  
  console.log('Testing with product:', product.Title);
  console.log('ID:', product.documentId);
  
  // Get one tag to test with
  const getTagQuery = gql`
    query GetOneTag {
      productTags(pagination: { limit: 1 }) {
        documentId
        Name
      }
    }
  `;
  
  const tagResult = await strapiClient.request(getTagQuery);
  const tag = tagResult.productTags[0];
  
  console.log('Testing with tag:', tag.Name);
  console.log('Tag ID:', tag.documentId);
  
  // Try different mutation approaches
  console.log('\n=== Attempting Update ===\n');
  
  const updateMutation = gql`
    mutation UpdateProduct($id: ID!, $data: ProductInput!) {
      updateProduct(id: $id, data: $data) {
        documentId
        Title
        Categorization {
          ProductTags {
            Name
          }
        }
      }
    }
  `;
  
  try {
    const result = await strapiClient.request(updateMutation, {
      id: product.documentId,
      data: {
        Categorization: {
          ProductTags: [tag.documentId]
        }
      }
    });
    
    console.log('✓ SUCCESS!');
    console.log('Updated product:', result.updateProduct.Title);
    console.log('Tags:', result.updateProduct.Categorization?.ProductTags || 'None');
    
  } catch (error) {
    console.log('✗ FAILED');
    console.log('Error:', error.message);
    if (error.response && error.response.errors) {
      console.log('Details:', JSON.stringify(error.response.errors, null, 2));
    }
  }
}

testTagUpdate().catch(console.error);
