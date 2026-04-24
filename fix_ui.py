import re

path = r"f:\Supply-Chain\src\pages\AdGenerator.tsx"
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace main background wrapper
text = text.replace('bg-[#0a0a0f] text-white', 'bg-background text-foreground')

# Replace border colors
text = text.replace('border-white/10', 'border-border')
text = text.replace('border-white/20', 'border-border')
text = text.replace('border-white/30', 'border-primary/50')
text = text.replace('border-white/8', 'border-border')

# Replace basic text colors
text = text.replace('text-white/30', 'text-muted-foreground/60')
text = text.replace('text-white/40', 'text-muted-foreground')
text = text.replace('text-white/50', 'text-muted-foreground')
text = text.replace('text-white/60', 'text-muted-foreground')
text = text.replace('text-white/70', 'text-foreground/80')
text = text.replace('text-white/80', 'text-foreground/90')
text = text.replace('text-white/90', 'text-foreground')
text = text.replace('text-white', 'text-foreground')

# Replace backgrounds
text = text.replace('bg-white/3', 'bg-muted/30')
text = text.replace('bg-white/5', 'bg-card')
text = text.replace('bg-white/8', 'bg-accent')
text = text.replace('bg-white/10', 'bg-accent hover:bg-accent/80')
text = text.replace('bg-white/20', 'bg-accent/80')

# Headers and gradients
text = text.replace('bg-gradient-to-r from-white via-purple-200 to-blue-200', 'bg-gradient-to-r from-blue-600 to-purple-600')
text = text.replace('from-purple-900/40 via-blue-900/30 to-emerald-900/30', 'from-purple-100 via-blue-50 to-emerald-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-emerald-900/20')

# Specific CopyCard colours logic (replace dark colors with light ones)
text = text.replace('from-purple-900/20 border-purple-500/20', 'from-purple-50 border-purple-200 dark:from-purple-900/20 dark:border-purple-800')
text = text.replace('from-blue-900/20 border-blue-500/20', 'from-blue-50 border-blue-200 dark:from-blue-900/20 dark:border-blue-800')
text = text.replace('from-emerald-900/20 border-emerald-500/20', 'from-emerald-50 border-emerald-200 dark:from-emerald-900/20 dark:border-emerald-800')
text = text.replace('from-yellow-900/20 border-yellow-500/20', 'from-yellow-50 border-yellow-200 dark:from-yellow-900/20 dark:border-yellow-800')
text = text.replace('from-pink-900/20 border-pink-500/20', 'from-pink-50 border-pink-200 dark:from-pink-900/20 dark:border-pink-800')
text = text.replace('from-orange-900/20 border-orange-500/20', 'from-orange-50 border-orange-200 dark:from-orange-900/20 dark:border-orange-800')
text = text.replace('from-cyan-900/20 border-cyan-500/20', 'from-cyan-50 border-cyan-200 dark:from-cyan-900/20 dark:border-cyan-800')
text = text.replace('from-slate-900/40 border-slate-500/20', 'from-slate-100 border-slate-200 dark:from-slate-800 dark:border-slate-700')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("SUCCESS")
