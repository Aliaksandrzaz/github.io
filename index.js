const cancelBtn = document.getElementById('search_cancel');
const searchBtn = document.getElementById('search');
const searchNextBtn = document.getElementById('search_next');
const searchPrevBtn = document.getElementById('search_prev');
const searchResult = document.getElementById('search_result');
const searchInput = document.getElementById('search_input');
const searchPreview = document.getElementById('search_preview');
const searchForm = document.getElementById('search_form');
const searchControls = document.getElementById('search_controls');
const searchPreviewList = searchPreview.querySelector('ul');

class Nodes {
    /**
     * @param {Array<HTMLElement>} nodes
     */
    nodes = [];

    clear() {
        if (nodeList[currentPos]?.innerHTML.includes('search_selected')) {
            nodeList[currentPos].innerHTML = removeSelectedWords(nodeList[currentPos].textContent, searchString);
        }

        this.nodes.forEach((node) => {
            node.innerHTML = node.innerHTML.replace(new RegExp('<mark class="highlight">', 'g'), ``).replace(new RegExp('</mark>', 'g'), '');
        });
        this.nodes = [];
    }

    add(nodes) {
        this.nodes = nodes
    }

    /**
     * @param {HTMLElement} el
     */
    find(el) {
        return this.nodes.find((node) => node.textContent === el.textContent);
    }

    isEmpty() {
        return !this.nodes.length;
    }
}


const nodeList = new Nodes();
let searchString = '';
let currentPos = 0;
let allMarks = [];
let isNextStep = true;

searchNextBtn.addEventListener('click', () => {
    if (!isNextStep) {
        currentPos = allMarks[currentPos + 2] ? currentPos + 2 : allMarks.length - 1;
    }
    allMarks[currentPos].innerHTML = selectWord(allMarks[currentPos].innerHTML, searchString);
    const prevMark = allMarks[currentPos - 1] ? allMarks[currentPos - 1] : allMarks[allMarks.length - 1];
    prevMark.innerHTML = removeSelectedWords(prevMark.innerHTML, searchString);

    allMarks[currentPos].scrollIntoView({behavior: 'smooth'});

    currentPos = allMarks[currentPos + 1] ? currentPos + 1 : 0;

    isNextStep = true;
})

searchPrevBtn.addEventListener('click', () => {
    if (isNextStep) {
        currentPos = allMarks[currentPos - 2] ? currentPos - 2 : allMarks.length - 1;
    }

    allMarks[currentPos].innerHTML = selectWord(allMarks[currentPos].innerHTML, searchString);
    const prevMark = allMarks[currentPos + 1] ? allMarks[currentPos + 1] : allMarks[allMarks.length - 1];
    prevMark.innerHTML = removeSelectedWords(prevMark.innerHTML, searchString);

    allMarks[currentPos].scrollIntoView({behavior: 'smooth'});

    currentPos = allMarks[currentPos - 1] ? currentPos - 1 : allMarks.length - 1;

    isNextStep = false;
})

searchBtn.addEventListener('click', () => {
    if (!nodeList.isEmpty()) {
        nodeList.nodes.forEach((node) => {
            node.innerHTML = highlightWords(node.textContent, searchString);
        });
        allMarks = document.querySelector('#search_container').querySelectorAll('mark')
        searchResult.textContent = `Найдено ${nodeList.nodes.length}`;
        searchBtn.classList.add('close');
        searchResult.classList.add('open');
        searchNextBtn.classList.add('open');
        searchPrevBtn.classList.add('open');
        searchControls.classList.add('open_controls')
        closePreviewList();
    }
})

searchPreviewList.addEventListener('click', (event) => {
    const el = nodeList.find(event.target.closest('li'));
    const prevValue = el.innerHTML;
    el.innerHTML = highlightWords(el.textContent, searchString);
    el.scrollIntoView({behavior: 'smooth'});

    setTimeout(() => {
        el.innerHTML = prevValue;
    }, 3000)
})

document.body.addEventListener('click', (event) => {
    if (!event.target.closest('#search_form') && !searchControls.classList.contains('open_controls')) {
        closeSearchForm()
        closePreviewList();
    }
})

searchForm.addEventListener('click', (event) => {
    if (event.target !== cancelBtn) {
        openSearchForm();

        if (!nodeList.isEmpty() && !event.target.closest('#search_controls')) {
            openPreviewList();
        }

    } else {
        closePreviewList();
    }
})

cancelBtn.addEventListener('click', () => {
    clearSelectedWordInDoc();
    closeSearchForm();
    closeFormControls();
    nodeList.clear();
    allMarks = [];
})

searchInput.addEventListener('input', (event) => {
    clearSelectedWordInDoc();
    searchString = event.target.value;
    nodeList.clear();
    allMarks = [];
    closeFormControls();
    clearSelectedWordInDoc();
    if (!searchString) {
        searchPreviewList.replaceChildren([]);
        closePreviewList();
        return;
    }

    const nodes = searchNodes(searchString);
    nodeList.add(nodes);

    openPreviewList();
    if (nodeList.nodes.length) {
        addNodeToList(nodeList.nodes, searchString)
    } else {
        clearSelectedWordInDoc();
        notFound();
    }
})

function clearSelectedWordInDoc() {
    const el = document.querySelector('.search_selected');
    if (el) {
        el.innerHTML = removeSelectedWords(el.innerHTML, searchString)
    }
}

function notFound() {
    const li = document.createElement("li");
    li.textContent = 'Ничего не найдено';
    searchPreviewList.replaceChildren([]);
    searchPreviewList.append(li)
}

/**
 * @param {Array<ParentNode>} nodes
 * @param {string} searchString
 */
function addNodeToList(nodes, searchString) {
    const fragment = document.createDocumentFragment();
    const max = nodes.length <= 4 ? nodes.length : 4;
    for (let i = 0; i < max; i++) {
        const li = document.createElement("li");
        li.innerHTML = `${highlightWords(nodes[i].textContent, searchString)}`;
        fragment.appendChild(li);
    }
    searchPreviewList.replaceChildren(fragment)
}

/**
 * @param {string} text
 * @param {string} searchString
 */
function highlightWords(text, searchString) {
    return text.replace(new RegExp(searchString, 'gi'), `<mark class="highlight">$&</mark>`);
}

/**
 * @param {string} text
 * @param {string} searchString
 */
function selectWord(text, searchString) {
    return text.replace(new RegExp(searchString, 'i'), `<span class="search_selected">$&</span>`);
}

/**
 * @param {string} text
 * @param {string} searchString
 */
function removeSelectedWords(text, searchString) {
    return text.replace(new RegExp('<span class="search_selected">', 'g'), `<mark class="highlight">`).replace(new RegExp('</span>', 'g'), '</mark>');
}

function searchNodes(searchText = /.*/, caseSensitive = false, exclusionarySelector = 'script', scope = document.body) {
    let flags = caseSensitive
        ? 'm'
        : 'im'
        , testRegEx = typeof (searchText.exec === 'undefined')
        ? new RegExp(searchText, flags)
        : searchText
        , excluding = (typeof (exclusionarySelector) !== searchText || exclusionarySelector == '')
        ? ':not(*)'
        : exclusionarySelector
        , foundNodes = [];

    const treeWalkerNodes = document.createTreeWalker(
        scope,
        4,
        {
            acceptNode: function (node) {
                return node.parentNode != null
                && node.nodeValue != null
                && !node.parentNode.matches(exclusionarySelector)
                && testRegEx.test(node.nodeValue.trim())
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT;
            }
        }
    );

    while ((node = treeWalkerNodes.nextNode())) {
        foundNodes.push(node.parentNode);
    }
    return foundNodes.length > 0
        ? foundNodes
        : [];
}

function openPreviewList() {
    searchPreview.classList.add('open');
}

function closePreviewList() {
    searchPreview.classList.remove('open');
}

function openSearchForm() {
    searchForm.classList.add('open');
    searchForm.classList.remove('closed');
}

function closeSearchForm() {
    searchForm.classList.add('closed');
    searchForm.classList.remove('open');
}


function closeFormControls() {
    searchBtn.classList.remove('close');
    searchResult.classList.remove('open');
    searchNextBtn.classList.remove('open');
    searchPrevBtn.classList.remove('open');
    searchControls.classList.remove('open_controls')
}
