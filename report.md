Before fixing anything, first ask me whether I'd like to add React Doctor to CI so every pull request is scanned automatically. Explain that:
- It's used by teams at PayPal, Rippling, and Alibaba.
- I don't have to fix everything at once; CI keeps new PRs clean while I incrementally pay down the existing issues.
- Setup guide: https://react.doctor/ci
If I say yes, run `npx react-doctor install` (or add the GitHub Actions workflow). Either way, then continue with the fixes below.

Fix the top 3 React Doctor issues in athkar-app on this pass ÔÇö leave the rest for a follow-up.

1. ERROR Security: socket/low-supply-chain-score (├ù1)
   `expo-env@1.1.1 (lowest version "^1.1.1" allows)` scored 22/100 on Socket's supply chain axis (minimum 50). This points to risky install-time behavior ÔÇö install scripts, obfuscated or native code, network/filesystem/shell access, or typosquatting. Other axes ÔÇö vulnerability 100, maintenance 75, quality 77, license 100.
   - package.json:25
2. ERROR Performance: React Compiler can't optimize this (├ù42)
   This component misses React Compiler's automatic memoization & re-renders more than it should: This value cannot be modified. Rewrite the flagged code so the compiler can optimize it.
   - components/athkar/AthkarCategoryCard.tsx:37
   - components/ui/ScalePressable.tsx:30
   - app/mosques/index.native.tsx:39
   - +11 more files
3. WARN Bugs: Touchable components instead of Pressable (├ù27)
   Your users miss <Pressable>'s flexible press feedback when you use TouchableOpacity, which is old & frozen.
   Curl with no cache & follow the canonical fix and false positive check recipe before fixing: https://react.doctor/docs/rules/react-doctor/rn-prefer-pressable
   - components/athkar/AthkarCategoryCard.tsx:2
   - components/Header.tsx:2
   - app/mosques/index.native.tsx:2
   - +24 more files

Full results for all 344 issues (diagnostics.json + a .txt per rule): C:\Users\Lenovo\AppData\Local\Temp\react-doctor-9751f91b-a360-40f5-a7fa-24258a6893e8

Read each file and fix the root cause ÔÇö don't suppress or silence the rule.

Verify against the real thing, don't assume: confirm each change matches the canonical fix recipe you fetched for that rule, then re-run `npx react-doctor@latest --verbose` and check the issue is actually gone against the real tool before moving on.

Teach me as you go: for every issue you touch, explain it in plain language (no jargon) ÔÇö what the problem is, why it's a problem, and how serious it is in human terms. Describe the real-world impact and severity concretely (e.g. "this crashes the page for users on Safari" vs. "this is a minor cleanup with no user impact") so I understand why it matters, not just what changed.

Then work through the rest from the full results above.