const { GraphQLClient, gql } = require('graphql-request');

const strapiClient = new GraphQLClient(
  'https://helpful-nature-fab70f9c51.strapiapp.com/graphql',
  {
    headers: {
      Authorization: 'Bearer 15ef74a4f45aca7ba42c25a4ca4d4a7f506c0fc396cf6b6c9760d61233e167a8322312cfdd971aa881e658fd41380973325ae053f3f3a436018cfab73970a77c9846636d98e6e7168aa1792d9975f4e304185a8ae5674f2ccdab2ccd8478e094753c2425a2e2e0e36eac25c1e30fb10af29fa6c194b1fa83576711c12a67065d',
    },
  }
);

async function understandCategorization() {
  console.log('=== UNDERSTANDING PRODUCT CATEGORIZATION STRUCTURE ===\n');
  
  // Get the mutation schema
  const mutationSchemaQuery = gql`
    query MutationSchema {
      __type(name: "Mutation") {
        fields(includeDeprecated: false) {
          name
          args {
            name
            type {
              name
              kind
              ofType {
                name
              }
            }
          }
        }
      }
    }
  `;
  
  const mutations = await strapiClient.request(mutationSchemaQuery);
  const updateProductMutation = mutations.__type.fields.find(f => f.name === 'updateProduct');
  
  console.log('updateProduct mutation args:');
  updateProductMutation.args.forEach(arg => {
    console.log(`  - ${arg.name}: ${arg.type.ofType?.name || arg.type.name}`);
  });
  
  // Check ProductInput type
  const productInputQuery = gql`
    query ProductInputSchema {
      __type(name: "ProductInput") {
        inputFields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  `;
  
  console.log('\n=== ProductInput Fields ===\n');
  const inputSchema = await strapiClient.request(productInputQuery);
  inputSchema.__type.inputFields.forEach(field => {
    const typeName = field.type.name || field.type.ofType?.name || 'unknown';
    console.log(`  ${field.name}: ${typeName}`);
  });
  
  // Check ComponentPdpSategorizationInput
  const catInputQuery = gql`
    query CategorizationInputSchema {
      __type(name: "ComponentPdpSategorizationInput") {
        inputFields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  `;
  
  console.log('\n=== CategorizationInput Fields ===\n');
  try {
    const catSchema = await strapiClient.request(catInputQuery);
    if (catSchema.__type) {
      catSchema.__type.inputFields.forEach(field => {
        const typeName = field.type.name || field.type.ofType?.name || 'unknown';
        console.log(`  ${field.name}: ${typeName}`);
      });
    }
  } catch (error) {
    console.log('Could not find CategorizationInput type');
  }
}

understandCategorization().catch(console.error);
