const { GraphQLClient, gql } = require('graphql-request');

const strapiClient = new GraphQLClient(
  'https://helpful-nature-fab70f9c51.strapiapp.com/graphql',
  {
    headers: {
      Authorization: 'Bearer 15ef74a4f45aca7ba42c25a4ca4d4a7f506c0fc396cf6b6c9760d61233e167a8322312cfdd971aa881e658fd41380973325ae053f3f3a436018cfab73970a77c9846636d98e6e7168aa1792d9975f4e304185a8ae5674f2ccdab2ccd8478e094753c2425a2e2e0e36eac25c1e30fb10af29fa6c194b1fa83576711c12a67065d',
    },
  }
);

async function checkProductTagStatus() {
  console.log('=== PRODUCT TAGGING STATUS ===\n');
  
  // Get total product count
  const countQuery = gql`
    query ProductCount {
      products(pagination: { limit: 1 }) {
        documentId
      }
    }
  `;
  
  try {
    const countResult = await strapiClient.request(countQuery);
    // Note: Strapi doesn't return count in query, need to check pagination
    console.log('Products exist in Strapi\n');
  } catch (error) {
    console.log('Error counting products:', error.message);
  }
  
  // Sample 20 products to check tag distribution
  const sampleQuery = gql`
    query SampleProducts {
      products(pagination: { limit: 20 }) {
        documentId
        Title
        Categorization {
          ProductTags {
            Name
          }
          ProductCollections {
            Name
          }
        }
      }
    }
  `;
  
  try {
    const result = await strapiClient.request(sampleQuery);
    const products = result.products || [];
    
    console.log(`Sampled ${products.length} products:\n`);
    
    let withTags = 0;
    let withCollections = 0;
    let withNeither = 0;
    
    products.forEach(product => {
      const hasTags = product.Categorization?.ProductTags && product.Categorization.ProductTags.length > 0;
      const hasCollections = product.Categorization?.ProductCollections && product.Categorization.ProductCollections.length > 0;
      
      if (hasTags) withTags++;
      if (hasCollections) withCollections++;
      if (!hasTags && !hasCollections) withNeither++;
    });
    
    console.log('┌─────────────────────────────────────┐');
    console.log('│ PRODUCT CATEGORIZATION STATUS       │');
    console.log('├─────────────────────────────────────┤');
    console.log(`│ With Tags: ${String(withTags).padStart(2)}/${products.length}                        │`);
    console.log(`│ With Collections: ${String(withCollections).padStart(2)}/${products.length}              │`);
    console.log(`│ Uncategorized: ${String(withNeither).padStart(2)}/${products.length}                 │`);
    console.log('└─────────────────────────────────────┘');
    
    console.log('\n=== CONCLUSION ===\n');
    
    if (withTags === 0) {
      console.log('❌ NO PRODUCTS ARE TAGGED');
      console.log('\nProducts have the ProductTags field in their schema,');
      console.log('but none are actually assigned tags yet.');
      console.log('\nTo enable tag-based collections, products need to be tagged.');
      console.log('\nOptions:');
      console.log('1. Manually tag products in Strapi admin');
      console.log('2. Create a sync script to auto-assign tags based on product names/attributes');
      console.log('3. Use Algolia index if tags are already there');
    } else {
      console.log(`✓ ${Math.round(withTags/products.length*100)}% of sampled products are tagged`);
      console.log('\nTag-based collections can be implemented!');
    }
    
    // Show sample product details
    if (products.length > 0) {
      console.log('\n\nSample Product Details:');
      console.log('────────────────────────────────\n');
      const sample = products[0];
      console.log(`Title: ${sample.Title}`);
      console.log(`Has Tags: ${sample.Categorization?.ProductTags?.length > 0 ? 'Yes' : 'No'}`);
      console.log(`Has Collections: ${sample.Categorization?.ProductCollections?.length > 0 ? 'Yes' : 'No'}`);
      console.log(`\nFull Categorization:`, JSON.stringify(sample.Categorization, null, 2));
    }
    
  } catch (error) {
    console.error('Error sampling products:', error.message);
    if (error.response && error.response.errors) {
      console.error('GraphQL errors:', JSON.stringify(error.response.errors, null, 2));
    }
  }
}

checkProductTagStatus();
