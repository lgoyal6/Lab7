describe('Basic user flow for Website', () => {
  beforeAll(async () => {
    await page.goto('https://cse110-sp25.github.io/CSE110-Shop/');
  });

  it('Initial Home Page - Check for 20 product items', async () => {
    console.log('Checking for 20 product items...');
    const numProducts = await page.$$eval('product-item', (prodItems) => {
      return prodItems.length;
    });
    expect(numProducts).toBe(20);
  });

  it('Make sure <product-item> elements are populated', async () => {
    console.log('Checking to make sure <product-item> elements are populated...');

    let allArePopulated = true;

    const prodItemsData = await page.$$eval('product-item', prodItems => {
      return prodItems.map(item => {
        return data = item.data;
      });
    });

    // STEP 1: loop over ALL items instead of just index 0
    // prodItemsData is an array of the .data property from each <product-item>
    // each .data object has title, price, and image fields
    // if any are empty strings, flip allArePopulated to false
    for (let i = 0; i < prodItemsData.length; i++) {
      console.log(`Checking product item ${i + 1}/${prodItemsData.length}`);
      const item = prodItemsData[i];
      if (item.title.length == 0) { allArePopulated = false; }
      if (item.price.length == 0) { allArePopulated = false; }
      if (item.image.length == 0) { allArePopulated = false; }
    }

    expect(allArePopulated).toBe(true);
  }, 10000);

  it('Clicking the "Add to Cart" button should change button text', async () => {
    console.log('Checking the "Add to Cart" button...');

    // STEP 2:
    // page.$('product-item') returns a handle to the first <product-item> in the DOM
    // a "handle" is just puppeteer's reference to a real DOM node -- you can call methods on it
    // web components have a shadowRoot -- their internal HTML lives there, not in the main document
    // we use $$eval to run the click entirely in the browser context -- more reliable than handle.click()
    await page.$$eval('product-item', items => {
      items[0].shadowRoot.querySelector('button').click();
    });

    // query the button text the same way -- runs in browser, returns a plain string
    const buttonText = await page.$$eval('product-item', items => {
      return items[0].shadowRoot.querySelector('button').innerText;
    });

    expect(buttonText).toBe('Remove from Cart');
  }, 2500);

  it('Checking number of items in cart on screen', async () => {
    console.log('Checking number of items in cart on screen...');

    // STEP 3:
    // runs entirely in browser, no back-and-forth per item
    // we already clicked item 0 in step 2, so we slice from index 1 to avoid toggling it back off
    await page.$$eval('product-item', items => {
      items.slice(1).forEach(item => {
        item.shadowRoot.querySelector('button').click();
      });
    });

    // #cart-count is a regular element in the main DOM (not shadow DOM), so page.$eval works fine
    // $eval queries the element and passes it to a function, returning the result directly
    const cartCount = await page.$eval('#cart-count', el => el.innerText);
    expect(cartCount).toBe('20');
  }, 10000);

  it('Checking number of items in cart on screen after reload', async () => {
    console.log('Checking number of items in cart on screen after reload...');

    // STEP 4:
    // reload the page -- localStorage persists across reloads so the cart should still be full
    await page.reload();

    // use $$eval so the whole check runs in the browser -- avoids per-item round trips that cause timeouts
    const allSayRemove = await page.$$eval('product-item', items => {
      return items.every(item => item.shadowRoot.querySelector('button').innerText === 'Remove from Cart');
    });

    expect(allSayRemove).toBe(true);

    const cartCount = await page.$eval('#cart-count', el => el.innerText);
    expect(cartCount).toBe('20');
  }, 10000);

  it('Checking the localStorage to make sure cart is correct', async () => {

    // STEP 5:
    // page.evaluate() runs a function directly in the browser context (not in Node/puppeteer)
    // localStorage is a browser API, so we have to use page.evaluate to access it
    // localStorage.getItem('cart') returns the value as a string
    const cart = await page.evaluate(() => localStorage.getItem('cart'));

    expect(cart).toBe('[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]');
  });

  it('Checking number of items in cart on screen after removing from cart', async () => {
    console.log('Checking number of items in cart on screen...');

    // STEP 6:
    // same as step 3, but now all buttons say "Remove from Cart"
    // clicking them removes each item from the cart
    await page.$$eval('product-item', items => {
      items.forEach(item => {
        item.shadowRoot.querySelector('button').click();
      });
    });

    const cartCount = await page.$eval('#cart-count', el => el.innerText);
    expect(cartCount).toBe('0');
  }, 10000);

  it('Checking number of items in cart on screen after reload', async () => {
    console.log('Checking number of items in cart on screen after reload...');

    // STEP 7:
    // reload again -- this time the cart should be empty and all buttons should say "Add to Cart"
    await page.reload();

    // use $$eval so the whole check runs in the browser -- avoids per-item round trips that cause timeouts
    const allSayAdd = await page.$$eval('product-item', items => {
      return items.every(item => item.shadowRoot.querySelector('button').innerText === 'Add to Cart');
    });

    expect(allSayAdd).toBe(true);

    const cartCount = await page.$eval('#cart-count', el => el.innerText);
    expect(cartCount).toBe('0');
  }, 10000);

  it('Checking the localStorage to make sure cart is correct', async () => {
    console.log('Checking the localStorage...');

    // STEP 8:
    // same as step 5, but now the cart should be empty
    const cart = await page.evaluate(() => localStorage.getItem('cart'));

    expect(cart).toBe('[]');
  });
});