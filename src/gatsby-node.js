const stripeClient = require('stripe');
const StripeObject = require('./StripeObject');

exports.sourceNodes = async (
  { actions, createContentDigest },
  { objects = [], secretKey = "" }
) => {

  const { createNode } = actions;

  if (!objects.length) {
    console.error(new Error("No Stripe object types found in your gatsby-config. Add types to the objects array like this: ['Balance', 'Customer', 'BalanceTransaction']"));
    return;
  }

  if (!secretKey) {
    console.error(new Error("No Stripe secret key found in your gatsby-config."));
    return;
  }

  const stripe = stripeClient(secretKey);

  stripe.setAppInfo({
    name: "Gatsby.js Stripe Source Plugin",
    version: "2.0.0",
    url: "https://www.npmjs.com/package/gatsby-source-stripe"
  });

  // Initialize stripeObjects based on gatsby plugin objects
  const stripeObjects = objects.map(type => new StripeObject(type));

  for (const stripeObj of stripeObjects) {

    /*
     * Outputs the stripe object's path, to allow us to
     * get to the proper method
     *
     * Example outputs:
     * const path = stripe['customers']
     * const path = stripe['terminal']['readers']
     */
    const path = stripeObj.objectPath(stripe);

    /*
     * Use for - await - of as per the Stripe.js Node documentation
     * for auto pagination purposes
     *
     * path[stripeObj.methodName](stripeObj.methodArgs) translates to
     * something like the following, depending on the object types
     * passed in the config:
     *
     * stripe['customers']['list']({ "expand": "data.default_source" })
     */
    for await (const payload of path[stripeObj.methodName](stripeObj.methodArgs)) {
      const node = stripeObj.node(createContentDigest, payload);
      createNode(node);
    }
  }

  return;

};
