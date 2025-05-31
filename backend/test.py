# TreeNode class to define each node of the BST
class TreeNode:
    def __init__(self, val):
        self.val = val       # store the value
        self.left = None     # left child
        self.right = None    # right child

# Function to insert a new value into the BST
def insert(root, val):
    # if current spot is empty, place the new value here
    if not root:
        return TreeNode(val)

    # if val is smaller, go left side
    if val < root.val:
        root.left = insert(root.left, val)

    # if val is bigger, go right side
    else:
        root.right = insert(root.right, val)

    # return the root after placing the value
    return root

# Main function to build BST from preorder list
def bstFromPreorder(preorder):
    root = None  # start with empty tree

    # loop through each value in preorder list
    for val in preorder:
        root = insert(root, val)  # insert into tree one by one

    return root  # final tree is ready

# Function to print the tree level by level (for testing)
def print_tree_level_order(root):
    if not root:
        return []

    queue = [root]
    result = []

    while queue:
        node = queue.pop(0)

        if node:
            result.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        else:
            result.append(None)

    # trim trailing None values
    while result and result[-1] is None:
        result.pop()

    return result


# Test input
preorder = [8, 5, 1, 7, 10, 12]
tree = bstFromPreorder(preorder)
print(print_tree_level_order(tree))  # Output should be [8, 5, 10, 1, 7, None, 12]
