/**
 * Min-Heap implementation for sorting an array of objects by a specific numeric key.
 */
export const heapSort = (arr, key = 'price') => {
  const n = arr.length;
  
  // Build a maxheap initially so we can sort in ascending order
  // (A maxheap places the largest element at root, which is then moved to end of array)
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(arr, n, i, key);
  }
  
  // Extract elements one by one from heap
  for (let i = n - 1; i > 0; i--) {
    // Move current root to end
    const temp = arr[0];
    arr[0] = arr[i];
    arr[i] = temp;
    
    // call max heapify on the reduced heap
    heapify(arr, i, 0, key);
  }
  
  return arr;
};

// To heapify a subtree rooted with node i which is an index in arr[]. 
// n is size of heap
function heapify(arr, n, i, key) {
  let largest = i; // Initialize largest as root
  const left = 2 * i + 1; // left child
  const right = 2 * i + 2; // right child
  
  const getVal = (idx) => {
    // Default to a high number if no price to push them to the end
    const val = parseFloat(arr[idx][key]);
    return isNaN(val) ? 0 : val;
  };

  // If left child is larger than root
  if (left < n && getVal(left) > getVal(largest)) {
    largest = left;
  }
  
  // If right child is larger than largest so far
  if (right < n && getVal(right) > getVal(largest)) {
    largest = right;
  }
  
  // If largest is not root
  if (largest !== i) {
    const swap = arr[i];
    arr[i] = arr[largest];
    arr[largest] = swap;
    
    // Recursively heapify the affected sub-tree
    heapify(arr, n, largest, key);
  }
}
