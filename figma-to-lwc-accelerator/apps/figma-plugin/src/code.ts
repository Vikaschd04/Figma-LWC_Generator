/// <reference types="@figma/plugin-typings" />

figma.showUI(__html__, { width: 500, height: 650 });

async function sendSelection() {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'selection', node: null, imageBytes: null });
    return;
  }

  const rootNode = selection[0];
  const nodeInfo = {
    id: rootNode.id,
    name: rootNode.name,
    type: rootNode.type,
    width: 'width' in rootNode ? rootNode.width : undefined,
    height: 'height' in rootNode ? rootNode.height : undefined
  };

  try {
    const bytes = await rootNode.exportAsync({
      format: 'PNG',
      constraint: { type: 'SCALE', value: 2 }
    });
    figma.ui.postMessage({ type: 'selection', node: nodeInfo, imageBytes: bytes });
  } catch (err) {
    console.error('Failed to export selection image:', err);
    figma.ui.postMessage({ type: 'selection', node: nodeInfo, imageBytes: null });
  }
}

// Send initial selection on load
sendSelection();

// Watch for selection changes
figma.on('selectionchange', () => {
  sendSelection();
});

// Listen for notifications or messages from UI
figma.ui.onmessage = (msg: { type: string; message?: string }) => {
  if (msg.type === 'notify' && msg.message) {
    figma.notify(msg.message);
  }
};
