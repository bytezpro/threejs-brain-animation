const ctx: Worker = self as any;

ctx.addEventListener('message', (event) => {
  const result = heavyComputation(event.data);
  ctx.postMessage(result);
});

function heavyComputation(data: any) {
  return data;
}

export {};
