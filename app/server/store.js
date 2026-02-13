// Shared store for vector store and retriever
let vectorStore = null;
let retriever = null;

export function setVectorStore(store) {
    vectorStore = store;
}

export function getVectorStore() {
    return vectorStore;
}

export function setRetriever(ret) {
    retriever = ret;
}

export function getRetriever() {
    return retriever;
}
