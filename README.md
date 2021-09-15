# WORK IN PROGRESS

# rc-promise - Real Cancellable Promise

A simple cancellable promise implementation for JavaScript and TypeScript.
Unlike
[make-cancellable-promise](https://www.npmjs.com/package/make-cancellable-promise)
which only prevents your promise's callbacks from executing, **`rc-promise`
cancels the underlying asynchronous operation (usually an HTTP call).** That's
why it's called **Real** Cancellable Promise.

-   ⚡ Compatible with [fetch](#fetch), [axios](#axios), and
    [jQuery.ajax](#jQuery)
-   ⚛ Built with React in mind — no more "setState after unmount" errors!
-   🐦 Lightweight — zero dependencies and only **PUT THE BUNDLE SIZE HERE LOL**
    minified and gzipped
-   🏭 Used in production by [Interface
    Technologies](http://www.iticentral.com/)
-   💻 Optimized for TypeScript
-   🔎 Compatible with
    [react-query](https://react-query.tanstack.com/guides/query-cancellation)
    query cancellation out of the box

# The Basics

```
yarn add rc-promise
```

```ts
import { CancellablePromise } from 'rc-promise'

const cancellablePromise = new CancellablePromise(normalPromise, cancel)

// Later...
cancellablePromise.cancel()

await cancellablePromise // throws a Cancellation object that subclasses Error
```

# Usage with HTTP Libraries

How do I convert a normal `Promise` to a `CancellablePromise`?

## <a name="fetch" href="https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch">fetch</a>

TODO

## <a name="axios" href="https://axios-http.com/">axios</a>

TODO

## <a name="jQuery" href="https://api.jquery.com/category/ajax/">jQuery.ajax</a>

TODO

# [API Reference](https://srmagura.github.io/rc-promise)

`CancellablePromise` supports all the methods that the normal `Promise` object
supports. See the [API Reference](https://srmagura.github.io/rc-promise) for
details.

# Examples

## React: Prevent setState after unmount

React will give you a warning if you attempt to update a component's state after
it has unmounted. This will happen if your component makes an API call but gets
unmounted before the API call completes.

You can fix this by canceling the API call in the cleanup function of an effect.

```ts
function listBlogPosts(): CancellablePromise<Post[]> {
    // call the API
}

export function Blog() {
    const [posts, setPosts] = useState<Post[]>([])

    useEffect(() => {
        const cancellablePromise = listBlogPosts().then(setPosts).catch(console.error)

        // The promise will get canceled when the component unmounts
        return cancellablePromise.cancel
    }, [])

    return <div>{posts.map(p => /* ... */)}</div>
}
```

[CodeSandbox](TODO)

## React: Cancel the in-progress API call when query parameters change

Sometimes API calls have parameters, like a search string entered by the user.

```ts
function searchUsers(searchTerm: string): CancellablePromise<User[]> {
    // call the API
}

export function UserList() {
    const [searchTerm, setSearchTerm] = useState('')
    const [users, setUsers] = useState<User[]>([])

    // In a real app you should debounce the searchTerm
    useEffect(() => {
        const cancellablePromise = searchUsers(searchTerm).then(setUsers).catch(console.error)

        // The old API call gets canceled whenever searchTerm changes. This prevents
        // setUsers from being called with incorrect results if the API calls complete
        // out of order.
        return cancellablePromise.cancel
    }, [searchTerm])

    return (
        <div>
            <SearchInput searchTerm={searchTerm} onChange={setSearchTerm} />
            {users.map(p => /* ... */)}
        </div>
    )
}
```

[CodeSandbox](TODO)

## Combine multiple API calls into a single async flow

The utility function `buildCancellablePromise` lets you `capture` every
cancellable operation in a multi-step process. In this example, if `bigQuery` is
canceled, each of the 3 API calls will be canceled (though some might have
already completed).

```ts
async function bigQuery(userId: number): CancellablePromise<QueryResult> {
    return buildCancellablePromise(async (capture) => {
        const userPromise = api.user.get(userId)
        const rolePromise = api.user.listRoles(userId)

        const [user, roles] = await capture(
            CancellablePromise.all([userPromise, rolePromise])
        )

        // User must be loaded before this query can run
        const customer = await capture(api.customer.get(user.customerId))

        return { user, roles, customer }
    })
}
```

## Usage with `react-query`

If your query key changes and there's an API call in progress, `react-query`
will cancel the `CancellablePromise` automatically.

```ts

```

[CodeSandbox](TODO)

## Handling `Cancellation`

Usually, you'll want to ignore `Cancellation` objects that get thrown:

```ts
try {
    await capture(cancellablePromise)
} catch (e) {
    if (e instanceof Cancellation) {
        // do nothing — the component probably just unmounted.
        // or you could do something here it's up to you 😆
        return
    }

    // log the error
}
```

## Handling promises that can't truly be canceled

Sometimes you need to call an asynchronous function that doesn't support
cancellation. In this case, you can use `pseudoCancellable` to prevent the
promise from resolving after `cancel` has been called.

```ts
const cancellablePromise = pseudoCancellable(normalPromise)

// Later...
cancellablePromise.cancel()

await cancellablePromise // throws Cancellation object
```

## `CancellablePromise.delay`

```ts
await CancellablePromise.delay(1000) // wait 1 second
```

## React: `useCancellablePromiseCleanup`

Here's a React hook that facilitates cancellation of `CancellablePromise`s that
occur outside of `useEffect`. Any pending API calls will be canceled when the
component unmounts. (Just be sure this is what you want to happen.)

```ts
export function useCancellablePromiseCleanup(): CaptureCancellablePromise {
    const cancellablePromisesRef = useRef<CancellablePromise<unknown>[]>([])

    useEffect(
        () => (): void => {
            for (const promise of cancellablePromisesRef.current) {
                promise.cancel()
            }
        },
        []
    )

    const capture: CaptureCancellablePromise = useCallback((promise) => {
        cancellablePromisesRef.current.push(promise)
        return promise
    }, [])

    return capture
}
```

Then in your React components...

```ts
function updateUser(id: number, name: string): CancellablePromise<void> {
    // call the API
}

export function UserDetail(props: UserDetailProps) {
    const capture = useCancellablePromiseCleanup()

    async function saveChanges(): Promise<void> {
        try {
            await capture(updateUser(id, name))
        } catch {
            // ...
        }
    }

    return <div>...</div>
}
```

[CodeSandbox](TODO)

# Supported Platforms

**Browser:** anything that's not Internet Explorer  
**Node.js:** current release and all maintained LTS releases

# License

MIT
