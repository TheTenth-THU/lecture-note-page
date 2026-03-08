**$z$ 变换**是**求解差分方程**的有力工具，类似于连续时间系统的 **Laplace 变换**。

## $z$ 变换及其收敛域

### 单边 $z$ 变换

可比照冲激抽样序列的 **Laplace 变换**
$$\begin{align}
&x_{\mathrm{s}} (t) = x (t) \delta_{T} (t) = \sum\limits_{n=0}^{\infty} x(nT) \delta(t - nT) \\
&\mapsto X_{\mathrm{s}}(s) = \mathscr{L} \{ x_{\mathrm{s}} (t) \} = \sum\limits_{n=0}^{\infty} x(nT) \e^{-s n T}
\end{align}$$
取 $z = \e^{sT}$ 并令 $T = 1$，得到离散时间序列 $x(n)$ 的单边 $z$ 变换为

> [!definition] 单边 $z$ 变换
> 离散时间序列 $x(n)$ 的**单边 $z$ 变换**定义为
> $$ X(z) = \mathscr{Z} \{ x(n) \} = \sum\limits_{n=0}^{\infty} x(n) z^{-n} $$

另一方面，也可由 Laurent 级数
$$
f(z) = \sum\limits_{n=-\infty}^{\infty} a_{n} (z - z_{0})^n
$$
定义 $z$ 变换为**复变量 $z^{-1}$ 的幂级数**，即 $z_{0} = 0$ 的 Laurent 级数。

### 双边 $z$ 变换

> [!definition] 双边 $z$ 变换
> 离散时间序列 $x(n)$ 的**双边 $z$ 变换**定义为
> $$ X(z) = \mathscr{Z} \{ x(n) \} = \sum\limits_{n=-\infty}^{\infty} x(n) z^{-n} $$

**因果序列的单边 $z$ 变换与双边 $z$ 变换相同**。Laplace 变换侧重单边，因为连续系统中非因果信号和系统的应用极少；而离散系统**非因果有些应用**，所以兼顾研究单边和双边。

### $z$ 变换的收敛域

$z$ 变换的收敛域（ROC）是指使得 **$z$ 变换级数收敛**的 $z$ 的值的集合。该级数收敛的充分条件是**绝对可和**，即
$$
\sum\limits_{n=-\infty}^{\infty} |x(n) z^{-n}| < \infty
$$
这又可引入判定法判别，即收敛条件为
$$
\begin{align}
&\begin{cases}
\lim\limits_{ n \to \infty } \left| \dfrac{x(n+1) z^{-n-1}}{x(n) z^{-n}} \right| = \dfrac{1}{|z|} \lim\limits_{ n \to \infty } \left| \dfrac{x(n+1)}{x(n)} \right| < 1  \\
\lim\limits_{ n \to -\infty } \left| \dfrac{x(n-1) z^{-n+1}}{x(n) z^{-n}} \right| = |z| \lim\limits_{ n \to -\infty } \left| \dfrac{x(n-1)}{x(n)} \right| < 1
\end{cases}  \\
& \Longrightarrow \lim\limits_{ n \to \infty } \left| \dfrac{x(n+1)}{x(n)} \right| < |z| < \lim\limits_{ n \to -\infty } \left| \dfrac{x(n)}{x(n-1)} \right|
\\
\text{OR} \quad &\begin{cases}
\lim\limits_{ n \to \infty} \sqrt[n]{ |x(n) z^{-n}| } = |z^{-1}| \lim\limits_{ n \to \infty} \sqrt[n]{ |x(n)| } < 1 \\
\lim\limits_{ n \to -\infty} \sqrt[-n]{ |x(n) z^{-n}| } = |z| \lim\limits_{ n \to -\infty} \sqrt[-n]{ |x(n)| } < 1
\end{cases} \\
& \Longrightarrow \lim\limits_{ n \to \infty} \sqrt[n]{ |x(n)| } < |z| < \lim\limits_{ n \to -\infty} \sqrt[-n]{ |x(n)| }
\end{align}
$$

与 Laplace 变换类似，$z$ 变换的 ROC 取决于序列 $x(n)$ 的性质。

$z$ 变换的收敛域可借助 **Laplace 变换**的收敛域进行分析。设 $z = r\e^{\I \theta}$，则
$$
z = \e^{sT} = \e^{(\sigma + \I \omega)T} = \e^{\sigma T} \e^{\I \omega T}
$$
即得
$$
r = \e^{\sigma T}, \quad \theta = \omega T
$$
此为 **$s$ 平面和 $z$ 平面之间的映射关系**。

#### 有限时宽信号 $\mapsto$ 有限时宽序列

有限时宽信号如 $x(t) = u(t) - u(t-t_{0})$ 的 Laplace 变换为
$$
\mathscr{L} \{ x(t) \} = \dfrac{1}{s} \left( 1 - \e^{-st_{0}} \right) 
$$
其 ROC 为**全平面**。

对应地，有限时宽序列如 $x(n) = \delta(n)$ 的 $z$ 变换为
$$
\mathscr{Z}\{ x(n) \} = \sum\limits_{n=-\infty}^{\infty} \delta(n) z^{-n} = 1
$$
其 ROC 为**全平面**。

#### 右边信号 $\mapsto$ 右边序列

右边信号如 $x(t) = \e^{-at} u(t)$ 的 Laplace 变换为
$$
\mathscr{L} \{ x(t) \} = \dfrac{1}{s+a}
$$
其 ROC 为 **$\mathfrak{Re} \{ s \} = \sigma > -a$**。

对应地，右边序列如 $x(n) = \e^{-an} u(n)$ 的 $z$ 变换为
$$
\mathscr{Z} \{ x(n) \} = \sum\limits_{n=0}^{\infty} \e^{-an} z^{-n} = \dfrac{1}{1 - \e^{-a} z^{-1}} = \dfrac{z}{z - \e^{-a}}
$$
其 ROC 为 **$|z| > \e^{-a}$**，是 $z$ 平面上一**圆盘之外**的区域。

#### 左边信号 $\mapsto$ 左边序列

左边信号如 $x(t) = -\e^{-at} u(-t)$ 的 Laplace 变换为
$$
\mathscr{L} \{ x(t) \} = \dfrac{1}{s+a}
$$
其 ROC 为 **$\mathfrak{Re} \{ s \} = \sigma < -a$**。

对应地，左边序列如 $x(n) = -\e^{-an} u(-n-1)$ 的 $z$ 变换为
$$
\mathscr{Z} \{ x(n) \} = \sum\limits_{n=-\infty}^{-1} -\e^{-an} z^{-n} = \dfrac{z}{z - \e^{-a}}
$$
其 ROC 为 **$|z| < \e^{-a}$**，是 $z$ 平面上一**圆盘之内**的区域。

#### 双边信号 $\mapsto$ 双边序列

双边信号如 $x(t) = \e^{-at}u(t) + \e^{bt}u(-t)$ 的 Laplace 变换为
$$
\mathscr{L} \{ x(t) \} = \dfrac{1}{s+a} - \dfrac{1}{s-b}
$$
其 ROC 为 **$-a < \sigma < b$**。

对应地，双边序列如 $x(n) = \e^{-an} u(n) + \e^{bn} u(-n-1)$ 的 $z$ 变换为
$$
\mathscr{Z} \{ x(n) \} = \sum\limits_{n=-\infty}^{-1} \e^{-an} z^{-n} + \sum\limits_{n=0}^{\infty} \e^{bn} z^{-n}
= \dfrac{z}{z - \e^{-a}} - \dfrac{z}{z - \e^{b}}
$$
其 ROC 为 **$\e^{-a} < |z| < \e^{b}$**，是 $z$ 平面上一**圆环之内**的区域。

## 逆 $z$ 变换

逆 $z$ 变换是从 $z$ 变换结果恢复原始序列的过程。一般地，有计算式
$$
x(n) = \mathscr{Z}^{-1} \{ X(z) \} = \dfrac{1}{2\pi \I} \oint_{C} X(z) z^{n-1} \dif z
$$
其中 $C$ 是包含 $X(z)z^{n-1}$ 所有**极点**的**逆时针**闭合曲线。

### 部分分式分解

对于有理函数 $X(z)$，可使用**部分分式分解**将其分解为简单的形式，然后**查表**计算逆 $z$ 变换。由于表中变换域函数**分子均带有至少一个 $z$**，因此通常先**将 $\dfrac{X(z)}{z}$ 展开**为分式和再乘以 $z$。

### 幂级数展开

左边、右边序列的有理函数式可分别在**升幂**、**降幂**形式下进行**长除法**，得到 $z^{-1}$ 的幂级数。

### 留数法

对于一般函数 $X(z)$，可使用**留数法**计算逆 $z$ 变换。由留数定理有
$$
x(n) = \dfrac{1}{2\pi\I} \oint_{C} X(z) z^{n-1} \dif z = \sum\limits_{k} \operatorname{Res} \left( X(z) z^{n-1}, z_k \right)
$$
其中 $\operatorname{Res} \left( X(z) z^{n-1}, z_k \right)$ 是极点 $z_k$ 处的**留数**。

对于 $s$ 阶极点 $z_k$，
$$
\operatorname{Res} \left( X(z) z^{n-1}, z_k \right) = \dfrac{1}{(s-1)!} \lim\limits_{z \to z_k} \dfrac{\dif^{s-1}}{\dif z^{s-1}} \left( (z - z_k)^s X(z) z^{n-1} \right)
$$
对于一阶极点，留数可简化为
$$
\operatorname{Res} \left( X(z) z^{n-1}, z_k \right) = \lim\limits_{z \to z_k} (z - z_k) X(z) z^{n-1}
$$

## $z$ 变换的基本性质

### 线性性质

已知 $X_{1}(z) = \mathscr{Z} \{ x_{1}(n) \}$ 和 $X_{2}(z) = \mathscr{Z} \{ x_{2}(n) \}$，则
$$
\mathscr{Z} \{ a_{1} x_{1}(n) + a_{2} x_{2}(n) \} = a_{1} X_{1}(z) + a_{2} X_{2}(z)
$$

### 时移性质

#### 双边 $z$ 变换的时移性质

已知 $X(z) = \mathscr{Z} \{ x(n) \}$，收敛域为 $R_{1} < |z| < R_{2}$，则
$$
\mathscr{Z} \{ x(n - n_{0}) \} = z^{-n_{0}} X(z)
$$
其中 $n_{0}$ 为整数；收敛域不变。

#### 单边 $z$ 变换的时移性质

已知 $X(z) = \mathscr{Z} \{ x(n) \}$，收敛域为 $R_{1} < |z| < R_{2}$，则
$$
\mathscr{Z} \{ x(n - n_{0}) \} = z^{-n_{0}} \left( X(z) + \sum\limits_{k=-n_{0}}^{-1} x(k) z^{-k} \right) 
$$
$$
\mathscr{Z} \{ x(n + n_{0}) \} = z^{n_{0}} \left( X(z) - \sum\limits_{k=0}^{n_{0}-1} x(k) z^{-k} \right)
$$
其中 $n_{0}$ 为正整数；收敛域不变。

特别地，对**因果**序列，时域右移时有
$$
\mathscr{Z} \{ x(n - n_{0}) \} = z^{-n_{0}} X(z)
$$

### 序列的时域加权

#### 线性加权：$z$ 域微分

已知 $X(z) = \mathscr{Z} \{ x(n) \}$，则
$$
\mathscr{Z} \{ n x(n) \} = -z \dfrac{\dif X(z)}{\dif z}
$$
收敛域不变。

#### 指数加权：$z$ 域压扩

已知 $X(z) = \mathscr{Z} \{ x(n) \}$，收敛域为 $R_{1} < |z| < R_{2}$，则
$$
\mathscr{Z} \{ a^{n} x(n) \} = X\left( \dfrac{z}{a} \right)
$$
收敛域变为 $R_{1} |a| < |z| < R_{2} |a|$。

### 初值定理、终值定理

对因果序列 $x(n)$，其单边 $z$ 变换为 $X(z)$，则
+ **初值定理**：$x(0) = \lim\limits_{z \to \infty} X(z)$
+ **终值定理**：$x(\infty) = \lim\limits_{z \to 1} \left( (z-1) X(z) \right)$
其中，终值定理要求 $X(z)$ 的极点在单位圆 $|z| < 1$ 内。

### 卷积定理

#### 时域卷积、$z$ 域乘积

已知 $X_{1}(z) = \mathscr{Z} \{ x_{1}(n) \}$ 和 $X_{2}(z) = \mathscr{Z} \{ x_{2}(n) \}$，则
$$
\mathscr{Z} \{ x_{1}(n) * x_{2}(n) \} = X_{1}(z) X_{2}(z)
$$
收敛域通常为**二者收敛域的交集**；在 $X_{1}(z)$ 与 $X_{2}(z)$ 出现（边缘）**零极点相消**时，**收敛域可能会扩大**。

#### $z$ 域卷积、时域乘积

已知 $X_{1}(z) = \mathscr{Z} \{ x_{1}(n) \}$ 和 $X_{2}(z) = \mathscr{Z} \{ x_{2}(n) \}$，则
$$
\begin{align}
\mathscr{Z} \{ x_{1}(n) x_{2}(n) \} &= \dfrac{1}{2\pi \I} \oint_{C_{1}} X_{1}\left( \dfrac{z}{v} \right) X_{2} (v) v^{-1} \dif v \\
&= \dfrac{1}{2\pi \I} \oint_{C_{2}} X_{1} (v) X_{2}\left( \dfrac{z}{v} \right) v^{-1} \dif v
\end{align}
$$
其中 $C_{1}$ 和 $C_{2}$ 分别是 $\left\{ X_{1}\left( \dfrac{z}{v} \right), X_{2}(v) \right\}$ 收敛域重叠区域、$\left\{ X_{1}(v), X_{2}\left( \dfrac{z}{v} \right) \right\}$ 收敛域重叠区域的**逆时针闭合曲线**。