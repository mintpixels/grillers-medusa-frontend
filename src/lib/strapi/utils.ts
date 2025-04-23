const ITEMS_PER_REQUEST = 20;

import strapiClient from './index';
// @ts-ignore
export async function multipleFetchRequests(quantityOfTotalItems, query, variables = {}) {
  const quantityOfRequest = Math.ceil(quantityOfTotalItems / ITEMS_PER_REQUEST);
  const arrRequests = [];

  for (let index = 0; index < quantityOfRequest; index += 1) {
    const extraVariables = {
      ...variables,
      pagination: {
        start: index * ITEMS_PER_REQUEST,
        limit: ITEMS_PER_REQUEST,
      },
    };
    arrRequests.push(strapiClient.request({ document: query, variables: extraVariables }));
  }

  const result = await Promise.all(arrRequests);
  // @ts-ignore
  return result.flatMap((response) => response.page.nodes);
}
